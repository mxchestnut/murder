import { useState, useEffect } from 'react';
import { Send, TestTube } from 'lucide-react';
import { api } from '../utils/api';

export default function MessagingPanel() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [roomId, setRoomId] = useState<string>('');
  const [testStatus, setTestStatus] = useState<string>('');
  
  // Test group room ID
  const TEST_ROOM_ID = '!mQnVqjtshmxgeXtTlX:matrix.org';

  useEffect(() => {
    // Initialize Matrix room for the two users
    initializeRoom();
  }, []);

  const initializeRoom = async () => {
    try {
      // This would create or get a DM room
      const response = await api.post('/messages/dm', { targetUserId: 2 });
      setRoomId(response.data.roomId);
      loadMessages(response.data.roomId);
    } catch (error) {
      console.error('Error initializing room:', error);
    }
  };

  const loadMessages = async (room: string) => {
    try {
      const response = await api.get(`/messages/room/${room}`);
      setMessages(response.data.chunk || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendTestMessage = async () => {
    setTestStatus('Sending...');
    try {
      await api.post('/messages/send', {
        roomId: TEST_ROOM_ID,
        message: `🧪 Test message from Cyarika Portal at ${new Date().toLocaleTimeString()}`
      });
      setTestStatus('✓ Message sent to group!');
      setTimeout(() => setTestStatus(''), 3000);
    } catch (error: any) {
      console.error('Error sending test message:', error);
      setTestStatus(`✗ Error: ${error.response?.data?.error || 'Failed to send'}`);
      setTimeout(() => setTestStatus(''), 5000);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !roomId) return;

    try {
      await api.post('/messages/send', {
        roomId,
        message
      });
      setMessage('');
      loadMessages(roomId);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div style={{
      width: '300px',
      borderLeft: `1px solid var(--border-color)`,
      background: 'var(--bg-secondary)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '1rem',
        borderBottom: `1px solid var(--border-color)`
      }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Messages</h3>
        
        {/* Test Message Button */}
        <button
          onClick={sendTestMessage}
          style={{
            width: '100%',
            padding: '1rem',
            borderRadius: '6px',
            border: '2px solid var(--accent-2)',
            background: 'var(--accent-2)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontWeight: 'bold',
            fontSize: '1rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <TestTube size={20} />
          Send Test to Group
        </button>
        
        {testStatus && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            borderRadius: '4px',
            background: testStatus.includes('✓') ? 'var(--accent-2)' : '#c74444',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            {testStatus}
          </div>
        )}
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'var(--bg-primary)',
              wordBreak: 'break-word'
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-1)', marginBottom: '0.25rem' }}>
              {msg.sender || 'Unknown'}
            </div>
            <div style={{ color: 'var(--text-primary)' }}>{msg.content?.body || ''}</div>
          </div>
        ))}
      </div>

      <div style={{
        padding: '1rem',
        borderTop: `1px solid var(--border-color)`,
        display: 'flex',
        gap: '0.5rem'
      }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRadius: '4px',
            border: `1px solid var(--border-color)`,
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)'
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: '0.75rem',
            borderRadius: '4px',
            border: 'none',
            background: 'var(--accent-2)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
