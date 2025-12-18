import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { api } from '../utils/api';

export default function MessagingPanel() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [roomId, setRoomId] = useState<string>('');

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
      borderLeft: '1px solid #4a4a4a',
      background: '#2d2d2d',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid #4a4a4a'
      }}>
        <h3>Messages</h3>
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
              background: '#1e1e1e',
              wordBreak: 'break-word'
            }}
          >
            <div style={{ fontSize: '0.85rem', color: '#8e9297', marginBottom: '0.25rem' }}>
              {msg.sender || 'Unknown'}
            </div>
            <div>{msg.content?.body || ''}</div>
          </div>
        ))}
      </div>

      <div style={{
        padding: '1rem',
        borderTop: '1px solid #4a4a4a',
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
            border: '1px solid #4a4a4a',
            background: '#1e1e1e',
            color: '#dcddde'
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: '0.75rem',
            borderRadius: '4px',
            border: 'none',
            background: '#5865f2',
            color: 'white',
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
