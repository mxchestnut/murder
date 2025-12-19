import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Editor from './Editor';
import MessagingPanel from './MessagingPanel';
import { api } from '../utils/api';
import { FileText, MessageSquare, LogOut, Sun, Moon } from 'lucide-react';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const [showMessaging, setShowMessaging] = useState(false);
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
              onClick={() => setShowMessaging(!showMessaging)}
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
            {currentDocument && !currentDocument.isFolder ? (
              <Editor 
                document={currentDocument} 
                onSave={(content) => {
                  api.post('/documents/document', {
                    id: currentDocument.id,
                    name: currentDocument.name,
                    content
                  });
                }}
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
    </div>
  );
}
