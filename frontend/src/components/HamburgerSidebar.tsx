import { useState, useEffect } from 'react';
import { Folder, File, Plus, FolderPlus, Upload, Trash2, Dices, RefreshCw, ChevronDown, ChevronRight, BookOpen, Settings, X, Download, ExternalLink, MessageCircle, Trophy, LogOut, HelpCircle, Sun, Moon, Bird, MoreVertical } from 'lucide-react';
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
  onShowDiscordCommands: () => void;
  onShowPromptsTropes: () => void;
  onShowHallOfFame: () => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function HamburgerSidebar({ documents, onSelectDocument, onSelectCharacter, onRefresh, currentDocument, currentCharacter, user, onShowAdminPanel, onShowFileManager, onShowKnowledgeBase, onShowStats, onShowSettings, onShowDiscordCommands, onShowPromptsTropes, onShowHallOfFame, onLogout, theme, toggleTheme }: HamburgerSidebarProps) {
  const [newItemName, setNewItemName] = useState('');
  const [showNewItem, setShowNewItem] = useState<'folder' | 'document' | null>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [characterSearch, setCharacterSearch] = useState('');
  const [showPathCompanionImport, setShowPathCompanionImport] = useState(false);
  const [pathCompanionCharacters, setPathCompanionCharacters] = useState<Array<{id: string, name: string, lastModified: string | null}>>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [importingPC, setImportingPC] = useState(false);
  const [importingCharacterId, setImportingCharacterId] = useState<string | null>(null);

  // Collapsible sections
  const [charactersExpanded, setCharactersExpanded] = useState(true);
  const [documentsExpanded, setDocumentsExpanded] = useState(true);
  const [helpMenuExpanded, setHelpMenuExpanded] = useState(false);
  const [userMenuExpanded, setUserMenuExpanded] = useState(false);

  // Menu dropdowns
  const [showCharactersMenu, setShowCharactersMenu] = useState(false);
  const [showFileManagerMenu, setShowFileManagerMenu] = useState(false);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const response = await api.get('/characters');
      setCharacters(response.data);
    } catch (error) {
      console.error('Error loading characters:', error);
    }
  };

  const loadPathCompanionCharacters = async () => {
    setLoadingCharacters(true);
    try {
      const response = await api.get('/pathcompanion/characters');
      setPathCompanionCharacters(response.data.characters || []);
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
    setImportingCharacterId(charId);
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
      setImportingCharacterId(null);
    }
  };

  const importAllPathCompanionCharacters = async () => {
    if (!confirm(`Import all ${pathCompanionCharacters.length} characters from PathCompanion?`)) {
      return;
    }

    setImportingPC(true);
    try {
      await api.post('/pathcompanion/import-all');
      loadCharacters();
      setShowPathCompanionImport(false);
      alert('Successfully imported all characters!');
    } catch (error: any) {
      console.error('Failed to import all PathCompanion characters:', error);
      const errorMsg = error.response?.data?.error || 'Failed to import characters.';
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
          <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bird size={24} style={{ color: 'var(--accent-1)' }} />
            Murder
          </h2>
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
                setShowCharactersMenu(!showCharactersMenu);
                setShowFileManagerMenu(false);
              }}
              style={{
                padding: '0.25rem',
                borderRadius: '4px',
                border: 'none',
                background: showCharactersMenu ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                color: showCharactersMenu ? 'white' : 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                zIndex: 10
              }}
              title="Character actions"
            >
              <MoreVertical size={14} />
            </button>
          </div>

          {/* Characters dropdown menu */}
          {showCharactersMenu && (
            <div style={{
              position: 'absolute',
              top: '3rem',
              right: '0.5rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              minWidth: '200px',
              overflow: 'hidden'
            }}>
              <button
                onClick={async () => {
                  console.log('Create character menu item clicked');
                  try {
                    // Create a new blank character
                    const response = await api.post('/characters', {
                      name: 'New Character',
                      level: 1,
                      characterClass: '',
                      race: '',
                      alignment: '',
                      strength: 10,
                      dexterity: 10,
                      constitution: 10,
                      intelligence: 10,
                      wisdom: 10,
                      charisma: 10
                    });
                    // Select the newly created character
                    onSelectCharacter(response.data);
                    // Reload the character list
                    await loadCharacters();
                  } catch (error) {
                    console.error('Failed to create character:', error);
                  }
                  setCharactersExpanded(true);
                  setShowCharactersMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Plus size={16} />
                Create Character
              </button>
              <button
                onClick={() => {
                  console.log('Import character(s) menu item clicked');
                  setShowPathCompanionImport(true);
                  loadPathCompanionCharacters();
                  setShowCharactersMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Download size={16} />
                Import Character(s)
              </button>
              <button
                onClick={() => {
                  console.log('Sync characters menu item clicked');
                  loadCharacters();
                  setShowCharactersMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <RefreshCw size={16} />
                Sync Characters
              </button>
            </div>
          )}
          {charactersExpanded && (
            <div style={{ padding: '0 1rem 1rem 1rem' }}>
              {characters.length > 10 && (
                <input
                  type="text"
                  placeholder="Search characters..."
                  value={characterSearch}
                  onChange={(e) => setCharacterSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    marginBottom: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              )}
              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                {characters.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    No characters yet
                  </p>
                ) : (
                  characters
                    .filter(char =>
                      char.name.toLowerCase().includes(characterSearch.toLowerCase())
                    )
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((char) => (
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
            </div>
          )}
        </div>

        {/* File Manager Section */}
        <div style={{ borderBottom: `1px solid var(--border-color)`, position: 'relative' }}>
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFileManagerMenu(!showFileManagerMenu);
                setShowCharactersMenu(false);
              }}
              style={{
                padding: '0.25rem',
                borderRadius: '4px',
                border: 'none',
                background: showFileManagerMenu ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                color: showFileManagerMenu ? 'white' : 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                zIndex: 10
              }}
              title="File manager actions"
            >
              <MoreVertical size={14} />
            </button>
          </div>

          {/* File Manager dropdown menu */}
          {showFileManagerMenu && (
            <div style={{
              position: 'absolute',
              top: '3rem',
              right: '0.5rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              minWidth: '200px',
              overflow: 'hidden'
            }}>
              <button
                onClick={() => {
                  setShowNewItem('folder');
                  setDocumentsExpanded(true);
                  setShowFileManagerMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <FolderPlus size={16} />
                Create Folder
              </button>
              <button
                onClick={() => {
                  setShowNewItem('document');
                  setDocumentsExpanded(true);
                  setShowFileManagerMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Plus size={16} />
                Create Document
              </button>
              <label style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                margin: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Upload size={16} />
                Upload File
                <input
                  type="file"
                  onChange={(e) => {
                    handleFileUpload(e);
                    setShowFileManagerMenu(false);
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}

          {documentsExpanded && showNewItem && (
            <div style={{ padding: '1rem', borderBottom: `1px solid var(--border-color)` }}>
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
                    background: 'var(--accent-color)',
                    color: 'white',
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
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {documentsExpanded && (
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

        {/* Prompts & Tropes Button */}
        <div style={{ borderBottom: `1px solid var(--border-color)` }}>
          <button
            onClick={() => onShowPromptsTropes()}
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
            <Dices size={18} />
            Prompts & Tropes
          </button>
        </div>

        {/* Hall of Fame Button */}
        <div style={{ borderBottom: `1px solid var(--border-color)` }}>
          <button
            onClick={() => onShowHallOfFame()}
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
            <Trophy size={18} />
            Hall of Fame
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

        {/* Help Accordion Menu */}
        <div style={{ marginTop: 'auto', borderTop: `2px solid var(--border-color)` }}>
          <div
            onClick={() => setHelpMenuExpanded(!helpMenuExpanded)}
            style={{
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              background: 'var(--bg-primary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HelpCircle size={18} />
              <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '1rem' }}>
                Help
              </span>
            </div>
            {helpMenuExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          {helpMenuExpanded && (
            <div style={{ padding: '0.5rem 1rem 1rem 1rem' }}>
              <button
                onClick={() => {
                  onShowDiscordCommands();
                  setHelpMenuExpanded(false);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '1rem',
                  textAlign: 'left'
                }}
              >
                <MessageCircle size={18} />
                Discord Commands
              </button>
            </div>
          )}
        </div>

        {/* User Menu Accordion */}
        <div style={{ borderTop: `1px solid var(--border-color)` }}>
          <div
            onClick={() => setUserMenuExpanded(!userMenuExpanded)}
            style={{
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              background: 'var(--bg-primary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={18} />
              <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '1rem' }}>
                {user.username}
              </span>
            </div>
            {userMenuExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          {userMenuExpanded && (
            <div style={{ padding: '0.5rem 1rem 1rem 1rem' }}>
              <button
                onClick={() => {
                  onShowSettings();
                  setUserMenuExpanded(false);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '1rem',
                  marginBottom: '0.5rem',
                  textAlign: 'left'
                }}
              >
                <Settings size={18} />
                Settings
              </button>
              <button
                onClick={toggleTheme}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '1rem',
                  marginBottom: '0.5rem',
                  textAlign: 'left'
                }}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
              <button
                onClick={onLogout}
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
                  gap: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: 500,
                  textAlign: 'left'
                }}
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PathCompanion Import Modal */}
      {showPathCompanionImport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            border: `2px solid var(--border-color)`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
                <ExternalLink size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                Import from PathCompanion
              </h2>
              <button
                onClick={() => setShowPathCompanionImport(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {loadingCharacters ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading characters...</p>
            ) : pathCompanionCharacters.length === 0 ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  No PathCompanion characters found. Make sure you've connected your PathCompanion account in Settings.
                </p>
                <button
                  onClick={() => loadPathCompanionCharacters()}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--accent-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <RefreshCw size={16} />
                  Try Again
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button
                    onClick={() => importAllPathCompanionCharacters()}
                    disabled={importingPC}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'var(--accent-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: importingPC ? 'not-allowed' : 'pointer',
                      opacity: importingPC ? 0.5 : 1,
                      flex: 1,
                      fontWeight: 600
                    }}
                  >
                    {importingPC ? 'Importing All...' : `Import All (${pathCompanionCharacters.length})`}
                  </button>
                  <button
                    onClick={() => loadPathCompanionCharacters()}
                    disabled={loadingCharacters}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      cursor: loadingCharacters ? 'not-allowed' : 'pointer',
                      opacity: loadingCharacters ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    title="Refresh list"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
                {pathCompanionCharacters.map((pcChar) => (
                  <div
                    key={pcChar.id}
                    style={{
                      padding: '1rem',
                      border: `1px solid var(--border-color)`,
                      borderRadius: '4px',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-secondary)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{pcChar.name}</div>
                      {pcChar.lastModified && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Last modified: {new Date(pcChar.lastModified).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => importPathCompanionCharacter(pcChar.id)}
                      disabled={importingPC}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'var(--accent-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: importingPC ? 'not-allowed' : 'pointer',
                        opacity: importingPC ? 0.5 : 1
                      }}
                    >
                      {importingCharacterId === pcChar.id ? 'Importing...' : 'Import'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
