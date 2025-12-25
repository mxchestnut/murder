import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Download, Trash2, Loader, CheckCircle, BookOpen, Image as ImageIcon, File, Search, X, Eye, FolderOpen, Grid, List } from 'lucide-react';
import { api } from '../utils/api';

interface FileRecord {
  id: number;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  virusScanStatus: string;
  category?: string;
  thumbnailUrl?: string;
}

export default function FileManager() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [learning, setLearning] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Array<{ name: string; progress: number; status: string }>>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

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

  const uploadFile = async (file: File) => {
    const fileIndex = uploadingFiles.length;
    setUploadingFiles(prev => [...prev, { name: file.name, progress: 0, status: 'uploading' }]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadingFiles(prev => prev.map((f, i) =>
              i === fileIndex ? { ...f, progress: percentCompleted } : f
            ));
          }
        }
      });

      setUploadingFiles(prev => prev.map((f, i) =>
        i === fileIndex ? { ...f, status: 'complete', progress: 100 } : f
      ));

      return true;
    } catch (error: any) {
      setUploadingFiles(prev => prev.map((f, i) =>
        i === fileIndex ? { ...f, status: 'error' } : f
      ));
      return false;
    }
  };

  const handleMultipleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    setMessage(null);

    const filesArray = Array.from(fileList);
    let successCount = 0;

    for (const file of filesArray) {
      const success = await uploadFile(file);
      if (success) successCount++;
    }

    await loadFiles();
    setUploading(false);

    setMessage({
      type: successCount === filesArray.length ? 'success' : 'error',
      text: `Uploaded ${successCount} of ${filesArray.length} file(s)`
    });

    // Clear upload list after 3 seconds
    setTimeout(() => setUploadingFiles([]), 3000);
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleMultipleFiles(event.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    handleMultipleFiles(files);
  };

  const handleDownload = async (file: FileRecord) => {
    try {
      const response = await api.get(`/files/${file.id}/download`);
      const { downloadUrl, fileName } = response.data;

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
    setLearning(file.id);
    try {
      await api.post(`/files/${file.id}/learn`);
      setMessage({ type: 'success', text: 'PDF content learned successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to learn from PDF' });
    } finally {
      setLearning(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (file: FileRecord) => {
    if (file.mimeType.startsWith('image/')) return <ImageIcon size={20} />;
    if (file.mimeType === 'application/pdf') return <FileText size={20} />;
    return <File size={20} />;
  };

  const getFileCategory = (file: FileRecord) => {
    if (file.category) return file.category;
    if (file.mimeType.startsWith('image/')) return 'image';
    if (file.mimeType === 'application/pdf') return 'document';
    return 'other';
  };

  // Filter files
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.originalFileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || getFileCategory(file) === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'All Files', count: files.length },
    { value: 'image', label: 'Images', count: files.filter(f => getFileCategory(f) === 'image').length },
    { value: 'document', label: 'Documents', count: files.filter(f => getFileCategory(f) === 'document').length },
    { value: 'other', label: 'Other', count: files.filter(f => getFileCategory(f) === 'other').length }
  ];

  const isImage = (mimeType: string) => mimeType.startsWith('image/');
  const isPDF = (mimeType: string) => mimeType === 'application/pdf';

  return (
    <div
      style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '2rem' }}>
              <FolderOpen size={32} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              File Manager
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
              {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
              title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
            >
              {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div style={{
            padding: '1rem',
            borderRadius: '6px',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: message.type === 'success' ? '#10b981' : '#ef4444',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {message.type === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
              {message.text}
            </div>
            <button
              onClick={() => setMessage(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Upload Area */}
        <div style={{
          position: 'relative',
          padding: '2rem',
          borderRadius: '8px',
          border: isDragging ? '2px dashed var(--accent-color)' : '2px dashed var(--border-color)',
          background: isDragging ? 'rgba(220, 20, 60, 0.05)' : 'var(--bg-secondary)',
          textAlign: 'center',
          marginBottom: '1.5rem',
          transition: 'all 0.2s'
        }}>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInput}
            multiple
            disabled={uploading}
            style={{ display: 'none' }}
          />
          <Upload size={48} style={{ color: 'var(--accent-color)', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
            {isDragging ? 'Drop files here' : 'Upload Files'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Drag and drop files here, or click to browse
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              border: 'none',
              background: uploading ? 'var(--bg-tertiary)' : 'var(--accent-color)',
              color: uploading ? 'var(--text-secondary)' : 'white',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: '1rem'
            }}
          >
            {uploading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite', verticalAlign: 'middle' }} /> Uploading...</> : 'Choose Files'}
          </button>
        </div>

        {/* Upload Progress */}
        {uploadingFiles.length > 0 && (
          <div style={{
            padding: '1rem',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-primary)' }}>Uploading Files</h4>
            {uploadingFiles.map((file, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-primary)' }}>{file.name}</span>
                  <span style={{ color: file.status === 'complete' ? '#10b981' : file.status === 'error' ? '#ef4444' : 'var(--text-secondary)' }}>
                    {file.status === 'complete' ? '✓ Complete' : file.status === 'error' ? '✗ Failed' : `${file.progress}%`}
                  </span>
                </div>
                <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${file.progress}%`,
                    background: file.status === 'error' ? '#ef4444' : file.status === 'complete' ? '#10b981' : 'var(--accent-color)',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: categoryFilter === cat.value ? 'var(--accent-color)' : 'var(--bg-secondary)',
                  color: categoryFilter === cat.value ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: categoryFilter === cat.value ? 600 : 400,
                  fontSize: '0.9rem'
                }}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px dashed var(--border-color)'
        }}>
          <FileText size={64} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No files found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {searchQuery || categoryFilter !== 'all' ? 'Try adjusting your filters' : 'Upload your first file to get started'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  height: '150px',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
                onClick={() => isImage(file.mimeType) || isPDF(file.mimeType) ? setPreviewFile(file) : null}
              >
                {isImage(file.mimeType) && file.thumbnailUrl ? (
                  <img src={file.thumbnailUrl} alt={file.originalFileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {getFileIcon(file)}
                  </div>
                )}
                {(isImage(file.mimeType) || isPDF(file.mimeType)) && (
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'rgba(0,0,0,0.6)',
                    borderRadius: '50%',
                    padding: '0.25rem',
                    color: 'white'
                  }}>
                    <Eye size={16} />
                  </div>
                )}
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }} title={file.originalFileName}>
                  {file.originalFileName}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  {formatFileSize(file.fileSize)}
                </div>
                <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'space-between' }}>
                  {isPDF(file.mimeType) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLearnFromPDF(file);
                      }}
                      disabled={learning === file.id}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '4px',
                        border: 'none',
                        background: learning === file.id ? 'var(--bg-tertiary)' : 'var(--accent-color)',
                        color: learning === file.id ? 'var(--text-secondary)' : 'white',
                        cursor: learning === file.id ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem'
                      }}
                      title="Learn from PDF"
                    >
                      {learning === file.id ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <BookOpen size={14} />}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(file);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                    title="Download"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #ef4444',
                      background: 'transparent',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 600 }}>Size</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 600 }}>Uploaded</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => (
                <tr key={file.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getFileIcon(file)}
                      <span>{file.originalFileName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{formatFileSize(file.fileSize)}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{new Date(file.uploadedAt).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      background: file.virusScanStatus === 'clean' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: file.virusScanStatus === 'clean' ? '#10b981' : '#ef4444',
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {file.virusScanStatus === 'clean' && <CheckCircle size={14} />}
                      {file.virusScanStatus}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {(isImage(file.mimeType) || isPDF(file.mimeType)) && (
                        <button
                          onClick={() => setPreviewFile(file)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                          }}
                          title="Preview"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {isPDF(file.mimeType) && (
                        <button
                          onClick={() => handleLearnFromPDF(file)}
                          disabled={learning === file.id}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: 'none',
                            background: learning === file.id ? 'var(--bg-tertiary)' : 'var(--accent-color)',
                            color: learning === file.id ? 'var(--text-secondary)' : 'white',
                            cursor: learning === file.id ? 'not-allowed' : 'pointer'
                          }}
                          title="Learn from PDF"
                        >
                          {learning === file.id ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <BookOpen size={16} />}
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(file)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer'
                        }}
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(file)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #ef4444',
                          background: 'transparent',
                          color: '#ef4444',
                          cursor: 'pointer'
                        }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 3000
          }}
          onClick={() => setPreviewFile(null)}
        >
          <div style={{
            padding: '1rem 2rem',
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, color: 'white' }}>{previewFile.originalFileName}</h3>
            <button
              onClick={() => setPreviewFile(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              <X size={24} />
            </button>
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {isImage(previewFile.mimeType) ? (
              <img
                src={previewFile.thumbnailUrl || `/api/files/${previewFile.id}/download`}
                alt={previewFile.originalFileName}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            ) : isPDF(previewFile.mimeType) ? (
              <iframe
                src={`/api/files/${previewFile.id}/download`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={previewFile.originalFileName}
              />
            ) : null}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
