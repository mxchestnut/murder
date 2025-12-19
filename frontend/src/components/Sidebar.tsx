import { useState } from 'react';
import { Folder, File, Plus, FolderPlus, Upload, Trash2 } from 'lucide-react';
import { api } from '../utils/api';

interface SidebarProps {
  documents: any[];
  onSelectDocument: (doc: any) => void;
  onRefresh: () => void;
  currentDocument: any;
}

export default function Sidebar({ documents, onSelectDocument, onRefresh, currentDocument }: SidebarProps) {
  const [newItemName, setNewItemName] = useState('');
  const [showNewItem, setShowNewItem] = useState<'folder' | 'document' | null>(null);

  const handleCreateFolder = async () => {
    if (!newItemName) return;
    
    try {
      await api.post('/documents/folder', { name: newItemName });
      setNewItemName('');
      setShowNewItem(null);
      onRefresh();
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleCreateDocument = async () => {
    if (!newItemName) return;
    
    try {
      await api.post('/documents/document', { 
        name: newItemName,
        content: '' 
      });
      setNewItemName('');
      setShowNewItem(null);
      onRefresh();
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onRefresh();
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleDelete = async (docId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await api.delete(`/documents/${docId}`);
      onRefresh();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  return (
    <div style={{
      width: '250px',
      background: 'var(--bg-secondary)',
      borderRight: `1px solid var(--border-color)`,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ padding: '1rem', borderBottom: `1px solid var(--border-color)` }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Documents</h3>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowNewItem('folder')}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: 'none',
              background: 'var(--accent-1)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.85rem'
            }}
          >
            <FolderPlus size={16} />
            Folder
          </button>

          <button
            onClick={() => setShowNewItem('document')}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: 'none',
              background: 'var(--accent-1)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.85rem'
            }}
          >
            <Plus size={16} />
            Doc
          </button>

          <label style={{
            padding: '0.5rem',
            borderRadius: '4px',
            background: 'var(--accent-1)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.85rem'
          }}>
            <Upload size={16} />
            Upload
            <input
              type="file"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {showNewItem && (
          <div style={{ marginTop: '0.5rem' }}>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`New ${showNewItem} name`}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '4px',
                border: `1px solid var(--border-color)`,
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={showNewItem === 'folder' ? handleCreateFolder : handleCreateDocument}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'var(--accent-2)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewItem(null);
                  setNewItemName('');
                }}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'var(--accent-1)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
        {documents.map((doc) => (
          <div
            key={doc.id}
            onClick={() => onSelectDocument(doc)}
            style={{
              padding: '0.75rem',
              borderRadius: '4px',
              cursor: 'pointer',
              background: currentDocument?.id === doc.id ? 'var(--accent-2)' : 'transparent',
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              color: 'var(--text-primary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
              {doc.isFolder ? <Folder size={16} /> : <File size={16} />}
              <span style={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }}>
                {doc.name}
              </span>
            </div>
            <button
              onClick={(e) => handleDelete(doc.id, e)}
              style={{
                padding: '0.25rem',
                borderRadius: '3px',
                border: 'none',
                background: 'transparent',
                color: '#c74444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
