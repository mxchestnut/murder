import { useState, useEffect } from 'react';
import { Image as ImageIcon, Trash2, Download, Loader, User, X, ZoomIn } from 'lucide-react';
import { api } from '../utils/api';

interface PhotoFile {
  id: number;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  category: string;
  isOptimized: boolean;
  hasThumbnail: boolean;
}

interface StorageQuota {
  used: number;
  total: number;
  usedMB: string;
  totalMB: string;
  percentUsed: number;
}

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [filter, setFilter] = useState<'all' | 'avatar' | 'image'>('all');
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoFile | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Map<number, string>>(new Map());
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPhotos();
  }, [filter]);

  const loadPhotos = async () => {
    try {
      const category = filter === 'all' ? undefined : filter;
      const params = category ? `?category=${category}` : '';
      const response = await api.get(`/files${params}`);

      // Filter only images
      const imageFiles = response.data.files.filter((f: PhotoFile) =>
        f.category === 'avatar' || f.category === 'image'
      );

      setPhotos(imageFiles);
      setQuota(response.data.quota);

      // Load photo URLs
      imageFiles.forEach(async (photo: PhotoFile) => {
        const urlResponse = await api.get(`/files/${photo.id}/download?thumbnail=true`);
        setPhotoUrls(prev => new Map(prev).set(photo.id, urlResponse.data.downloadUrl));
      });
    } catch (error) {
      console.error('Failed to load photos:', error);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>, category: 'avatar' | 'image') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate image
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage({
        type: 'success',
        text: `${category === 'avatar' ? 'Avatar' : 'Photo'} uploaded successfully!`
      });

      await loadPhotos();
      event.target.value = '';
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to upload photo'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photo: PhotoFile) => {
    if (!confirm(`Delete "${photo.originalFileName}"?`)) return;

    try {
      await api.delete(`/files/${photo.id}`);
      setMessage({ type: 'success', text: 'Photo deleted successfully' });
      setSelectedPhoto(null);
      await loadPhotos();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete photo' });
    }
  };

  const handleDownload = async (photo: PhotoFile) => {
    try {
      const response = await api.get(`/files/${photo.id}/download`);
      const { downloadUrl, fileName } = response.data;

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to download photo' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-lavender-300 mb-2">Photo Gallery</h1>
        <p className="text-lavender-100/60">Upload and manage your avatars and images</p>
      </div>

      {/* Storage Quota */}
      {quota && (
        <div className="bg-dark-700/50 border border-lavender-500/20 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lavender-100">Storage Used</span>
            <span className="text-lavender-300 font-mono">
              {quota.usedMB} MB / {quota.totalMB} MB
            </span>
          </div>
          <div className="w-full bg-dark-900 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                quota.percentUsed > 90 ? 'bg-red-500' :
                quota.percentUsed > 75 ? 'bg-yellow-500' :
                'bg-lavender-500'
              }`}
              style={{ width: `${Math.min(quota.percentUsed, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.type === 'success'
            ? 'bg-green-500/20 border border-green-500/50 text-green-200'
            : 'bg-red-500/20 border border-red-500/50 text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Upload Buttons & Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <label className="flex items-center gap-2 px-6 py-3 bg-lavender-600 hover:bg-lavender-700 text-white rounded-lg cursor-pointer transition-colors">
          <User className="w-5 h-5" />
          {uploading ? 'Uploading...' : 'Upload Avatar'}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handlePhotoUpload(e, 'avatar')}
            disabled={uploading}
            className="hidden"
          />
        </label>

        <label className="flex items-center gap-2 px-6 py-3 bg-lavender-600 hover:bg-lavender-700 text-white rounded-lg cursor-pointer transition-colors">
          <ImageIcon className="w-5 h-5" />
          {uploading ? 'Uploading...' : 'Upload Photo'}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handlePhotoUpload(e, 'image')}
            disabled={uploading}
            className="hidden"
          />
        </label>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-lavender-600 text-white'
                : 'bg-dark-700 text-lavender-100 hover:bg-dark-600'
            }`}
          >
            All Photos
          </button>
          <button
            onClick={() => setFilter('avatar')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'avatar'
                ? 'bg-lavender-600 text-white'
                : 'bg-dark-700 text-lavender-100 hover:bg-dark-600'
            }`}
          >
            Avatars
          </button>
          <button
            onClick={() => setFilter('image')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'image'
                ? 'bg-lavender-600 text-white'
                : 'bg-dark-700 text-lavender-100 hover:bg-dark-600'
            }`}
          >
            Photos
          </button>
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
        {photos.map((photo) => {
          const url = photoUrls.get(photo.id);
          return (
            <div
              key={photo.id}
              className="break-inside-avoid mb-4 group relative cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="bg-dark-700/50 border border-lavender-500/20 rounded-lg overflow-hidden hover:border-lavender-500/50 transition-all">
                {url ? (
                  <img
                    src={url}
                    alt={photo.originalFileName}
                    className="w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-square bg-dark-800 flex items-center justify-center">
                    <Loader className="w-8 h-8 text-lavender-400 animate-spin" />
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-medium truncate">{photo.originalFileName}</p>
                    <p className="text-white/60 text-sm">{formatFileSize(photo.fileSize)}</p>
                    {photo.category === 'avatar' && (
                      <span className="inline-block mt-2 px-2 py-1 bg-lavender-600 text-white text-xs rounded">
                        Avatar
                      </span>
                    )}
                  </div>
                  <div className="absolute top-4 right-4">
                    <ZoomIn className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {photos.length === 0 && (
        <div className="text-center py-20">
          <ImageIcon className="w-20 h-20 text-lavender-500/30 mx-auto mb-4" />
          <p className="text-lavender-100/60 text-lg">
            No photos yet. Upload your first {filter === 'avatar' ? 'avatar' : 'photo'}!
          </p>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh] w-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhoto(null);
              }}
              className="absolute -top-12 right-0 text-white hover:text-lavender-400 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            <img
              src={photoUrls.get(selectedPhoto.id) || ''}
              alt={selectedPhoto.originalFileName}
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 rounded-b-lg">
              <h3 className="text-white text-xl font-bold mb-2">{selectedPhoto.originalFileName}</h3>
              <div className="flex items-center gap-4 text-white/80 text-sm mb-4">
                <span>{formatFileSize(selectedPhoto.fileSize)}</span>
                <span>•</span>
                <span>{new Date(selectedPhoto.uploadedAt).toLocaleDateString()}</span>
                {selectedPhoto.isOptimized && (
                  <>
                    <span>•</span>
                    <span className="text-green-400">Optimized</span>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(selectedPhoto);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-lavender-600 hover:bg-lavender-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(selectedPhoto);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
