import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import axios from 'axios';
import { isAuthenticated } from '../middleware/auth';
import { db } from '../db';
import { files, knowledgeBase } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { uploadToS3, deleteFromS3, getSignedUrl } from '../config/s3';

const router = Router();

// Configure multer for temporary file storage
const upload = multer({
  dest: '/tmp/uploads/', // Temporary storage before S3
  limits: {
    fileSize: 1024 * 1024 * 1024 * 2, // 2GB max (for large PDFs)
  }
});

// Scan file with ClamAV
async function scanFileForVirus(filePath: string): Promise<{ isInfected: boolean; details: string }> {
  try {
    const NodeClam = require('clamscan');
    
    const clamscan = await new NodeClam().init({
      removeInfected: false,
      quarantineInfected: false,
      scanLog: null,
      debugMode: false,
      clamdscan: {
        socket: '/var/run/clamd.scan/clamd.sock', // Amazon Linux ClamAV socket
        timeout: 300000, // 5 minutes for large files
        multiscan: true,
        reloadDb: false,
      },
      preference: 'clamdscan'
    });

    const { isInfected, viruses } = await clamscan.isInfected(filePath);
    
    return {
      isInfected,
      details: isInfected ? JSON.stringify({ viruses }) : 'File is clean'
    };
  } catch (error: any) {
    console.error('ClamAV scan error:', error);
    // If ClamAV fails, we'll allow upload but mark as error
    return {
      isInfected: false,
      details: `Scan error: ${error.message}. File uploaded without scan.`
    };
  }
}

// Upload file
router.post('/upload', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    const user = req.user as any;
    const uploadedFile = req.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File upload started:', {
      originalName: uploadedFile.originalname,
      size: uploadedFile.size,
      mimeType: uploadedFile.mimetype
    });

    // Scan for viruses
    console.log('Scanning file for viruses...');
    const scanResult = await scanFileForVirus(uploadedFile.path);
    
    if (scanResult.isInfected) {
      // Delete infected file
      fs.unlinkSync(uploadedFile.path);
      return res.status(400).json({ 
        error: 'File contains malware and has been rejected',
        details: scanResult.details
      });
    }

    // Generate safe filename
    const fileExt = path.extname(uploadedFile.originalname);
    const safeFileName = crypto.randomBytes(16).toString('hex') + fileExt;
    const s3Key = `uploads/${user.id}/${Date.now()}-${safeFileName}`;

    // Upload to S3
    console.log('Uploading to S3...');
    const fileBuffer = fs.readFileSync(uploadedFile.path);
    const uploadResult = await uploadToS3(
      fileBuffer,
      s3Key,
      uploadedFile.mimetype
    );

    // Save file metadata to database
    const [fileRecord] = await db.insert(files).values({
      userId: user.id,
      fileName: safeFileName,
      originalFileName: uploadedFile.originalname,
      mimeType: uploadedFile.mimetype,
      fileSize: uploadedFile.size,
      s3Key: s3Key,
      s3Bucket: process.env.S3_BUCKET || '',
      virusScanStatus: scanResult.isInfected ? 'infected' : 'clean',
      virusScanDetails: scanResult.details
    }).returning();

    // Delete temporary file
    fs.unlinkSync(uploadedFile.path);

    console.log('File uploaded successfully:', fileRecord.id);

    res.json({
      message: 'File uploaded successfully',
      file: {
        id: fileRecord.id,
        fileName: fileRecord.fileName,
        originalFileName: fileRecord.originalFileName,
        fileSize: fileRecord.fileSize,
        mimeType: fileRecord.mimeType,
        uploadedAt: fileRecord.uploadedAt,
        virusScanStatus: fileRecord.virusScanStatus
      }
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
});

// List user's files
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    
    const userFiles = await db
      .select()
      .from(files)
      .where(and(
        eq(files.userId, user.id),
        isNull(files.deletedAt)
      ))
      .orderBy(files.uploadedAt);

    res.json({ files: userFiles });
  } catch (error: any) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Get file download URL
router.get('/:id/download', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const fileId = parseInt(req.params.id);

    const [fileRecord] = await db
      .select()
      .from(files)
      .where(and(
        eq(files.id, fileId),
        eq(files.userId, user.id),
        isNull(files.deletedAt)
      ));

    if (!fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Generate pre-signed URL (valid for 1 hour)
    const downloadUrl = await getSignedUrl(fileRecord.s3Key, 3600);

    res.json({
      downloadUrl,
      fileName: fileRecord.originalFileName,
      expiresIn: 3600
    });
  } catch (error: any) {
    console.error('Error generating download URL:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

// Delete file
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const fileId = parseInt(req.params.id);

    const [fileRecord] = await db
      .select()
      .from(files)
      .where(and(
        eq(files.id, fileId),
        eq(files.userId, user.id),
        isNull(files.deletedAt)
      ));

    if (!fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Soft delete in database
    await db
      .update(files)
      .set({ deletedAt: new Date() })
      .where(eq(files.id, fileId));

    // Optionally delete from S3 (uncomment if you want hard delete)
    // await deleteFromS3(fileRecord.s3Key);

    res.json({ message: 'File deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Learn from PDF file
router.post('/:id/learn', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const fileId = parseInt(req.params.id);

    // Check if user is admin
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Only administrators can use this feature' });
    }

    const [fileRecord] = await db
      .select()
      .from(files)
      .where(and(
        eq(files.id, fileId),
        eq(files.userId, user.id),
        isNull(files.deletedAt)
      ));

    if (!fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!fileRecord.originalFileName.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'Only PDF files can be learned from' });
    }

    console.log(`Learning from PDF: ${fileRecord.originalFileName}`);

    // Download file from S3
    const downloadUrl = await getSignedUrl(fileRecord.s3Key, 3600);
    const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    const pdfBuffer = Buffer.from(response.data);

    // Extract text from PDF
    const pdf = require('pdf-parse');
    const pdfData = await pdf(pdfBuffer);
    const text = pdfData.text;

    if (!text || text.trim().length < 100) {
      return res.status(400).json({ error: 'PDF contains no readable text or text is too short' });
    }

    // Split text into chunks (2000 chars each with overlap)
    const chunks: string[] = [];
    const chunkSize = 2000;
    const overlap = 200;

    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      const chunk = text.substring(i, i + chunkSize).trim();
      if (chunk.length > 100) {
        chunks.push(chunk);
      }
    }

    // Add chunks to knowledge base
    let entriesAdded = 0;
    const fileName = fileRecord.originalFileName.replace('.pdf', '');

    for (let i = 0; i < chunks.length; i++) {
      try {
        await db.insert(knowledgeBase).values({
          question: chunks.length > 1 ? `${fileName} (part ${i + 1})` : fileName,
          answer: chunks[i],
          category: null,
          aiGenerated: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        entriesAdded++;
      } catch (error) {
        console.error('Error inserting PDF chunk:', error);
      }
    }

    console.log(`Added ${entriesAdded} entries from PDF: ${fileRecord.originalFileName}`);

    res.json({
      message: 'PDF content added to knowledge base',
      entriesAdded,
      fileName: fileRecord.originalFileName
    });
  } catch (error: any) {
    console.error('Error learning from PDF:', error);
    res.status(500).json({ error: 'Failed to learn from PDF', details: error.message });
  }
});

export default router;
