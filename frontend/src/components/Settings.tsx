import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Link, Unlink, Loader } from 'lucide-react';
import { api } from '../utils/api';

interface PathCompanionConnectionStatus {
  connected: boolean;
  username?: string;
}

export default function Settings() {
  const [pathCompanion, setPathCompanion] = useState<PathCompanionConnectionStatus>({
    connected: false
  });
  const [connectForm, setConnectForm] = useState({ username: '', password: '' });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConnectionStatus();
  }, []);

  const loadConnectionStatus = async () => {
    try {
      const response = await api.get('/auth/me');
      setPathCompanion({
        connected: response.data.user.pathCompanionConnected || false,
        username: response.data.user.pathCompanionUsername
      });
    } catch (error) {
      console.error('Failed to load connection status:', error);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setMessage(null);

    try {
      await api.post('/auth/pathcompanion/connect', connectForm);
      await loadConnectionStatus();
      setConnectForm({ username: '', password: '' });
      setMessage({ type: 'success', text: 'Successfully connected to PathCompanion! You can now import your characters from the Character Sheets tab.' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to connect. Check your credentials.' 
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your PathCompanion account?')) return;
    
    setIsDisconnecting(true);
    setMessage(null);

    try {
      await api.post('/auth/pathcompanion/disconnect');
      await loadConnectionStatus();
      setMessage({ type: 'success', text: 'PathCompanion account disconnected.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disconnect. Please try again.' });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <SettingsIcon size={32} />
        <h1>Settings</h1>
      </div>

      <div className="settings-content">
        <section className="settings-section">
          <h2>PathCompanion Integration</h2>
          <p className="section-description">
            Connect your PathCompanion account to automatically import and sync your characters.
          </p>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          {pathCompanion.connected ? (
            <div className="connection-status connected">
              <div className="status-icon">
                <Link size={24} />
              </div>
              <div className="status-info">
                <div className="status-label">Connected</div>
                <div className="status-value">{pathCompanion.username}</div>
              </div>
              <button 
                className="button danger"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <>
                    <Loader size={18} className="spinner" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <Unlink size={18} />
                    Disconnect
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="connection-form">
              <form onSubmit={handleConnect}>
                <div className="form-group">
                  <label htmlFor="pc-username">PathCompanion Username or Email</label>
                  <input
                    id="pc-username"
                    type="text"
                    value={connectForm.username}
                    onChange={(e) => setConnectForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter username or email"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="pc-password">PathCompanion Password</label>
                  <input
                    id="pc-password"
                    type="password"
                    value={connectForm.password}
                    onChange={(e) => setConnectForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="button primary"
                  disabled={isConnecting || !connectForm.username || !connectForm.password}
                >
                  {isConnecting ? (
                    <>
                      <Loader size={18} className="spinner" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link size={18} />
                      Connect PathCompanion Account
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .settings-container {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .settings-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .settings-header h1 {
          margin: 0;
          font-size: 2rem;
        }

        .settings-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .settings-section {
          background-color: var(--card-bg, #ffffff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
          padding: 2rem;
        }

        .settings-section h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
        }

        .section-description {
          margin: 0 0 1.5rem 0;
          color: var(--text-secondary, #718096);
        }

        .message {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }

        .message.success {
          background-color: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .message.error {
          background-color: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          border-radius: 8px;
          border: 2px solid var(--border-color, #e2e8f0);
        }

        .connection-status.connected {
          border-color: #10b981;
          background-color: #f0fdf4;
        }

        .status-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: #10b981;
          color: white;
        }

        .status-info {
          flex: 1;
        }

        .status-label {
          font-size: 0.875rem;
          color: var(--text-secondary, #718096);
          margin-bottom: 0.25rem;
        }

        .status-value {
          font-weight: 600;
          font-size: 1.125rem;
        }

        .connection-form {
          max-width: 400px;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 6px;
          font-size: 1rem;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--primary-color, #667eea);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 1rem;
        }

        .button.primary {
          background-color: var(--primary-color, #667eea);
          color: white;
        }

        .button.primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .button.danger {
          background-color: #ef4444;
          color: white;
        }

        .button.danger:hover:not(:disabled) {
          background-color: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
