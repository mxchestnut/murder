import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Editor from './Editor';
import MessagingPanel from './MessagingPanel';
import CharacterSheets from './CharacterSheets';
import { api } from '../utils/api';
import { FileText, MessageSquare, LogOut, Sun, Moon, X, Dices } from 'lucide-react';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const [showMessaging, setShowMessaging] = useState(false);
  const [showCharacters, setShowCharacters] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareDocument, setShareDocument] = useState<any>(null);
  const [shareUsername, setShareUsername] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const loadDocuments = async (parentId?: number) => {
    try {
      const response = await api.get('/documents', { params: { parentId } });
      setDocuments(response.data);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleShare = (doc: any) => {
    setShareDocument(doc);
    setShowShareModal(true);
  };

  const sendShare = async () => {
    if (!shareDocument || !shareUsername) return;

    try {
      // Create a direct message room and send document link
      const roomResponse = await api.post('/messages/dm', { 
        username: shareUsername 
      });
      
      await api.post('/messages/send', {
        roomId: roomResponse.data.roomId,
        message: `${user.username} shared a document with you: "${shareDocument.name}"\n\nDocument ID: ${shareDocument.id}`
      });

      alert(`Document shared with ${shareUsername}!`);
      setShowShareModal(false);
      setShareUsername('');
    } catch (error) {
      console.error('Error sharing document:', error);
      alert('Failed to share document. Make sure the username exists and Matrix is configured.');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Sidebar
        documents={documents}
        onSelectDocument={setCurrentDocument}
        onRefresh={loadDocuments}
        currentDocument={currentDocument}
      />

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          borderBottom: `1px solid var(--border-color)`,
          background: 'var(--bg-secondary)'
        }}>
          <h2 style={{ color: 'var(--text-primary)' }}>{currentDocument?.name || 'Cyarika'}</h2>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={toggleTheme}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: 'none',
                background: 'var(--accent-2)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <button
              onClick={() => {
                setShowCharacters(!showCharacters);
                setShowMessaging(false);
              }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: 'none',
                background: showCharacters ? 'var(--accent-2)' : 'var(--accent-1)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Dices size={18} />
              Characters
            </button>

            <button
              onClick={() => {
                setShowMessaging(!showMessaging);
                setShowCharacters(false);
              }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: 'none',
                background: showMessaging ? 'var(--accent-2)' : 'var(--accent-1)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <MessageSquare size={18} />
              Messages
            </button>

            <span style={{ color: 'var(--text-primary)' }}>{user.username}</span>
            
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: 'none',
                background: '#c74444',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {showCharacters ? (
              <CharacterSheets />
            ) : currentDocument && !currentDocument.isFolder ? (
              <Editor 
                document={currentDocument} 
                onSave={(content) => {
                  api.post('/documents/document', {
                    id: currentDocument.id,
                    name: currentDocument.name,
                    content
                  });
                }}
                onShare={handleShare}
              />
            ) : (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: '#8e9297'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <FileText size={64} style={{ margin: '0 auto 1rem' }} />
                  <p>Select a document to start editing</p>
                </div>
              </div>
            )}
          </div>

          {showMessaging && (
            <MessagingPanel />
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '2rem',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Share Document</h2>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareUsername('');
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Share "{shareDocument?.name}" with another user via Matrix message
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Username
              </label>
              <input
                type="text"
                value={shareUsername}
                onChange={(e) => setShareUsername(e.target.value)}
                placeholder="Enter username"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: `1px solid var(--border-color)`,
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={sendShare}
                disabled={!shareUsername}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: shareUsername ? 'var(--accent-2)' : 'var(--accent-1)',
                  color: 'var(--text-primary)',
                  cursor: shareUsername ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                Share
              </button>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareUsername('');
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
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
        </div>
      )}
    </div>
  );
}
