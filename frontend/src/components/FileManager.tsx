import { useState, useEffect } from 'react';
import { Upload, FileText, Download, Trash2, Loader, AlertCircle, CheckCircle, BookOpen } from 'lucide-react';
import { api } from '../utils/api';

interface FileRecord {
  id: number;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  virusScanStatus: string;
}

export default function FileManager() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [learning, setLearning] = useState<number | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await api.get('/files');
      setFiles(response.data.files);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress('Uploading file...');
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setUploadProgress('Scanning for viruses...');
      await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage({
        type: 'success',
        text: `File "${file.name}" uploaded successfully!`
      });

      await loadFiles();

      // Clear file input
      event.target.value = '';
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to upload file'
      });
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleDownload = async (file: FileRecord) => {
    try {
      const response = await api.get(`/files/${file.id}/download`);
      const { downloadUrl, fileName } = response.data;

      // Open download URL in new tab
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to download file' });
    }
  };

  const handleDelete = async (file: FileRecord) => {
    if (!confirm(`Delete "${file.originalFileName}"?`)) return;

    try {
      await api.delete(`/files/${file.id}`);
      setMessage({ type: 'success', text: 'File deleted successfully' });
      await loadFiles();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete file' });
    }
  };

  const handleLearnFromPDF = async (file: FileRecord) => {
    if (!file.originalFileName.toLowerCase().endsWith('.pdf')) {
      setMessage({ type: 'error', text: 'Only PDF files can be learned from' });
      return;
    }

    if (!confirm(`Add content from "${file.originalFileName}" to the knowledge base?`)) return;

    setLearning(file.id);
    setMessage(null);

    try {
      const response = await api.post(`/files/${file.id}/learn`);
      const { entriesAdded } = response.data;

      setMessage({
        type: 'success',
        text: `✅ Added ${entriesAdded} entries from "${file.originalFileName}" to knowledge base!`
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to learn from PDF'
      });
    } finally {
      setLearning(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  return (
    <div className="file-manager-container">
      <div className="file-manager-header">
        <h1>File Manager</h1>
        <p className="subtitle">Upload and manage your files securely</p>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="upload-section">
        <label className="upload-button">
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          {uploading ? (
            <>
              <Loader size={20} className="spinner" />
              {uploadProgress}
            </>
          ) : (
            <>
              <Upload size={20} />
              Choose File to Upload
            </>
          )}
        </label>
        <p className="upload-note">
          All files are scanned for viruses before upload. No file size limits.
        </p>
      </div>

      <div className="files-list">
        {files.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>No files uploaded yet</p>
          </div>
        ) : (
          <table className="files-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id}>
                  <td className="file-name">
                    <FileText size={18} />
                    {file.originalFileName}
                  </td>
                  <td>{formatFileSize(file.fileSize)}</td>
                  <td>{new Date(file.uploadedAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${file.virusScanStatus}`}>
                      {file.virusScanStatus === 'clean' && <CheckCircle size={14} />}
                      {file.virusScanStatus}
                    </span>
                  </td>
                  <td className="actions">
                    {file.originalFileName.toLowerCase().endsWith('.pdf') && (
                      <button
                        onClick={() => handleLearnFromPDF(file)}
                        className="action-button learn"
                        title="Learn from PDF"
                        disabled={learning === file.id}
                      >
                        {learning === file.id ? (
                          <Loader size={18} className="spinner" />
                        ) : (
                          <BookOpen size={18} />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(file)}
                      className="action-button download"
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      className="action-button delete"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .file-manager-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .file-manager-header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
        }

        .subtitle {
          margin: 0;
          color: var(--text-secondary);
        }

        .message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          margin: 1.5rem 0;
          font-weight: 500;
        }

        .message.success {
          background-color: var(--accent-light);
          color: var(--accent-color);
          border: 1px solid var(--accent-color);
        }

        .message.error {
          background-color: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .upload-section {
          background: var(--bg-secondary);
          border: 2px dashed var(--border-color);
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          margin: 2rem 0;
        }

        .upload-button {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 2rem;
          background: var(--accent-color);
          color: var(--accent-text);
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .upload-button:hover:not(:disabled) {
          background: var(--accent-hover);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .upload-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .upload-note {
          margin: 1rem 0 0 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .files-list {
          margin-top: 2rem;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
        }

        .empty-state svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .files-table {
          width: 100%;
          border-collapse: collapse;
          background: var(--bg-secondary);
          border-radius: 12px;
          overflow: hidden;
        }

        .files-table thead {
          background: var(--bg-tertiary);
        }

        .files-table th {
          padding: 1rem 1.5rem;
          text-align: left;
          font-weight: 600;
          color: var(--text-primary);
        }

        .files-table td {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-color);
        }

        .files-table tr:hover {
          background: var(--hover-bg);
        }

        .file-name {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 500;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-badge.clean {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge.infected {
          background: #fee2e2;
          color: #991b1b;
        }

        .actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-button {
          padding: 0.5rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .action-button:hover {
          transform: translateY(-2px);
        }

        .action-button.download:hover {
          background: var(--accent-color);
          color: var(--accent-text);
        }

        .action-button.learn:hover:not(:disabled) {
          background: #10b981;
          color: white;
        }

        .action-button.learn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .action-button.delete:hover {
          background: #ef4444;
          color: white;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
