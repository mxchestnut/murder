import { useState, useEffect } from 'react';
import { Folder, File, Plus, FolderPlus, Upload, Trash2, Dices, Download, ExternalLink, X, RefreshCw, ChevronDown, ChevronRight, BookOpen, Settings } from 'lucide-react';
import { api } from '../utils/api';

interface HamburgerSidebarProps {
  documents: any[];
  onSelectDocument: (doc: any) => void;
  onSelectCharacter: (character: any) => void;
  onRefresh: () => void;
  currentDocument: any;
  currentCharacter: any;
  user: any;
  onShowAdminPanel: () => void;
  onShowFileManager: () => void;
  onShowKnowledgeBase: () => void;
  onShowStats: () => void;
  onShowSettings: () => void;
}

export default function HamburgerSidebar({ documents, onSelectDocument, onSelectCharacter, onRefresh, currentDocument, currentCharacter, user, onShowAdminPanel, onShowFileManager, onShowKnowledgeBase, onShowStats, onShowSettings }: HamburgerSidebarProps) {
  const [newItemName, setNewItemName] = useState('');
  const [showNewItem, setShowNewItem] = useState<'folder' | 'document' | null>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<Array<{id: string, name: string, lastModified: string | null}>>([]);
  const [showPathCompanionImport, setShowPathCompanionImport] = useState(false);
  const [pathCompanionCharacters, setPathCompanionCharacters] = useState<Array<{id: string, name: string, lastModified: string | null}>>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [importingPC, setImportingPC] = useState(false);

  // Collapsible sections
  const [campaignsExpanded, setCampaignsExpanded] = useState(true);
  const [charactersExpanded, setCharactersExpanded] = useState(true);
  const [documentsExpanded, setDocumentsExpanded] = useState(true);

  useEffect(() => {
    loadCharacters();
    loadCampaigns();
  }, []);

  const loadCharacters = async () => {
    try {
      const response = await api.get('/characters');
      setCharacters(response.data);
    } catch (error) {
      console.error('Error loading characters:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await api.get('/pathcompanion/characters');
      setCampaigns(response.data.campaigns || []);
    } catch (error) {
      // Silently fail - campaigns are optional
    }
  };

  const loadPathCompanionCharacters = async () => {
    setLoadingCharacters(true);
    try {
      const response = await api.get('/pathcompanion/characters');
      setPathCompanionCharacters(response.data.characters || []);
      setCampaigns(response.data.campaigns || []);
    } catch (error: any) {
      console.error('Failed to load PathCompanion characters:', error);
      const errorMsg = error.response?.data?.error || 'Failed to load characters.';
      if (errorMsg.includes('connect your PathCompanion account in Settings')) {
        alert('Please connect your PathCompanion account in Settings first.');
      } else {
        alert(errorMsg);
      }
    } finally {
      setLoadingCharacters(false);
    }
  };

  const importPathCompanionCharacter = async (charId: string) => {
    setImportingPC(true);
    try {
      await api.post('/pathcompanion/import', { characterId: charId });
      loadCharacters();
      alert('Successfully imported character!');
    } catch (error: any) {
      console.error('Failed to import PathCompanion character:', error);
      const errorMsg = error.response?.data?.error || 'Failed to import character.';
      alert(errorMsg);
    } finally {
      setImportingPC(false);
    }
  };

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
    <>
      {/* Sidebar - always visible */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '300px',
        background: 'var(--bg-secondary)',
        borderRight: `2px solid var(--border-color)`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        overflowY: 'auto'
      }}>
        <div style={{ padding: '1.5rem 1rem', borderBottom: `1px solid var(--border-color)` }}>
          <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.5rem' }}>Murder</h2>
        </div>

        {/* Characters Section */}
        <div style={{ borderBottom: `1px solid var(--border-color)` }}>
          <div
            onClick={() => {
              setCharactersExpanded(!charactersExpanded);
              if (!charactersExpanded) {
                onShowStats();
              }
            }}
            style={{
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              background: charactersExpanded ? 'var(--accent-1)' : 'transparent'
            }}
          >
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {charactersExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <Dices size={18} />
              Characters
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                loadCharacters();
              }}
              style={{
                padding: '0.25rem',
                borderRadius: '4px',
                border: 'none',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Refresh characters"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          {charactersExpanded && (
            <div style={{ padding: '0 1rem 1rem 1rem', maxHeight: '200px', overflow: 'auto' }}>
              {characters.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  No characters yet
                </p>
              ) : (
                characters.map((char) => (
                  <div
                    key={char.id}
                    onClick={() => {
                      onSelectCharacter(char);

                    }}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '4px',
                      background: currentCharacter?.id === char.id ? 'var(--accent-2)' : 'var(--bg-primary)',
                      marginBottom: '0.25rem',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{char.name}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* File Manager Section */}
        <div style={{ borderBottom: `1px solid var(--border-color)` }}>
          <div
            onClick={() => {
              setDocumentsExpanded(!documentsExpanded);
              if (!documentsExpanded) {
                onShowFileManager();
              }
            }}
            style={{
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              background: documentsExpanded ? 'var(--accent-1)' : 'transparent',
              borderBottom: `1px solid var(--border-color)`
            }}
          >
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {documentsExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <File size={18} />
              File Manager
            </h3>
          </div>
          {documentsExpanded && (
            <>
              <div style={{ padding: '1rem', borderBottom: `1px solid var(--border-color)` }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowNewItem('folder')}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: 'none',
                      background: 'var(--accent-2)',
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
                      background: 'var(--accent-2)',
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
                    background: 'var(--accent-2)',
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
                    onClick={() => {
                      onSelectDocument(doc);

                    }}
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
            </>
          )}
        </div>

        {/* Knowledge Base Button */}
        <div style={{ borderBottom: `1px solid var(--border-color)` }}>
          <button
            onClick={() => onShowKnowledgeBase()}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '0',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
              textAlign: 'left'
            }}
          >
            <BookOpen size={18} />
            Knowledge Base
          </button>
        </div>

        {/* Settings Button */}
        <div style={{ borderBottom: `1px solid var(--border-color)` }}>
          <button
            onClick={() => onShowSettings()}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '0',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
              textAlign: 'left'
            }}
          >
            <Settings size={18} />
            Settings
          </button>
        </div>

        {/* Admin Panel (only for admins) */}
        {user?.isAdmin && (
          <div style={{ padding: '1rem', borderTop: `1px solid var(--border-color)` }}>
            <button
              onClick={() => {
                onShowAdminPanel();
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '4px',
                border: 'none',
                background: 'var(--accent-color)',
                color: 'var(--accent-text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '1rem',
                fontWeight: 500
              }}
            >
              🛡️ Admin Panel
            </button>
          </div>
        )}
      </div>

      {/* PathCompanion Import Modal */}
      {showPathCompanionImport && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1002
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPathCompanionImport(false);
            }
          }}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              border: '1px solid var(--border-color)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Import from PathCompanion</h3>
              <button
                onClick={() => {
                  setShowPathCompanionImport(false);
                  setPathCompanionCharacters([]);
                }}
                style={{
                  padding: '0.25rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div>
              {loadingCharacters ? (
                <p style={{ color: 'var(--text-primary)' }}>Loading your PathCompanion characters...</p>
              ) : pathCompanionCharacters.length > 0 ? (
                <div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Select a character to import:
                  </p>
                  <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                    {pathCompanionCharacters.map(char => (
                      <div
                        key={char.id}
                        onClick={() => {
                          importPathCompanionCharacter(char.id);
                          setShowPathCompanionImport(false);
                          setPathCompanionCharacters([]);
                        }}
                        style={{
                          padding: '1rem',
                          marginBottom: '0.5rem',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          cursor: importingPC ? 'wait' : 'pointer',
                          background: 'var(--bg-primary)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <div style={{ fontWeight: 500 }}>{char.name}</div>
                        {char.lastModified && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Last modified: {new Date(char.lastModified).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  <p>No characters found in your PathCompanion account.</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Make sure you're logged into PathCompanion and have characters saved.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
