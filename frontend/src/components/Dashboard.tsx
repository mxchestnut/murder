import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Editor from './Editor';
import MessagingPanel from './MessagingPanel';
import { api } from '../utils/api';
import { FileText, MessageSquare, LogOut } from 'lucide-react';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const [showMessaging, setShowMessaging] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

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
          borderBottom: '1px solid #4a4a4a',
          background: '#2d2d2d'
        }}>
          <h2>{currentDocument?.name || 'Cyarika'}</h2>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowMessaging(!showMessaging)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: 'none',
                background: showMessaging ? '#5865f2' : '#4a4a4a',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <MessageSquare size={18} />
              Messages
            </button>

            <span>{user.username}</span>
            
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: 'none',
                background: '#f04747',
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
