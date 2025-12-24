import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Link, Unlink, Loader, Sun, Moon, Palette, Shield, LogOut } from 'lucide-react';
import { api } from '../utils/api';
import { useTheme } from '../utils/useTheme';

interface PathCompanionConnectionStatus {
  connected: boolean;
  username?: string;
}

export default function Settings() {
  const { theme, setThemeMode, setAccentColor } = useTheme();
  
  const [pathCompanion, setPathCompanion] = useState<PathCompanionConnectionStatus>({
    connected: false
  });
  const [connectForm, setConnectForm] = useState({ username: '', password: '' });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isLoggingOutAllDevices, setIsLoggingOutAllDevices] = useState(false);
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

  const handleLogoutAllDevices = async () => {
    if (!confirm('This will log you out on all devices. You will need to log in again. Continue?')) {
      return;
    }

    setIsLoggingOutAllDevices(true);
    setMessage(null);

    try {
      const response = await api.post('/auth/logout-all-devices');
      setMessage({ 
        type: 'success', 
        text: `Successfully logged out ${response.data.devicesLoggedOut} device(s). Redirecting to login...` 
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to logout all devices' 
      });
      setIsLoggingOutAllDevices(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <SettingsIcon size={32} />
        <h1>Settings</h1>
      </div>

      <div className="settings-content">
        {/* Appearance Settings */}
        <section className="settings-section">
          <h2>
            <Palette size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Appearance
          </h2>
          <p className="section-description">
            Customize the look and feel of Cyar'ika with your preferred theme and accent color.
          </p>

          <div className="appearance-controls">
            {/* Theme Mode Toggle */}
            <div className="theme-mode-selector">
              <label className="theme-label">Theme Mode</label>
              <div className="mode-buttons">
                <button
                  className={`mode-button ${theme.mode === 'light' ? 'active' : ''}`}
                  onClick={() => setThemeMode('light')}
                  aria-label="Light mode"
                >
                  <Sun size={20} />
                  <span>Light</span>
                </button>
                <button
                  className={`mode-button ${theme.mode === 'dark' ? 'active' : ''}`}
                  onClick={() => setThemeMode('dark')}
                  aria-label="Dark mode"
                >
                  <Moon size={20} />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* Accent Color Picker */}
            <div className="accent-color-selector">
              <label className="theme-label">Accent Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="color"
                  value={theme.accentColor}
                  onChange={(e) => {
                    // Only update if it's a valid hex color (native picker always provides valid values)
                    const value = e.target.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                      setAccentColor(value);
                    }
                  }}
                  style={{
                    width: '60px',
                    height: '40px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                />
                <input
                  type="text"
                  value={theme.accentColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow typing # and hex characters
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                      setAccentColor(value);
                    }
                  }}
                  onBlur={(e) => {
                    // Validate on blur and reset to previous if invalid
                    if (!/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      setAccentColor(theme.accentColor);
                    }
                  }}
                  placeholder="#6366f1"
                  style={{
                    flex: 1,
                    maxWidth: '120px',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Choose any color
                </span>
              </div>
            </div>
          </div>
        </section>

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

        {/* Security Settings */}
        <section className="settings-section">
          <h2>
            <Shield size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Security
          </h2>
          <p className="section-description">
            Manage your account security and active sessions across devices.
          </p>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="security-action">
            <div className="action-info">
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>
                Logout All Devices
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                End all active sessions on all devices. You'll need to log in again on each device.
              </p>
            </div>
            <button 
              className="button danger"
              onClick={handleLogoutAllDevices}
              disabled={isLoggingOutAllDevices}
            >
              {isLoggingOutAllDevices ? (
                <>
                  <Loader size={18} className="spinner" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut size={18} />
                  Logout All Devices
                </>
              )}
            </button>
          </div>
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
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
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
          background-color: var(--accent-light);
          color: var(--accent-color);
          border: 1px solid var(--accent-color);
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
          border-color: var(--accent-color);
          background-color: var(--accent-light);
        }

        .status-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: var(--accent-color);
          color: var(--accent-text);
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
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px var(--accent-light);
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
          background-color: var(--accent-color);
          color: var(--accent-text);
        }

        .button.primary:hover:not(:disabled) {
          background-color: var(--accent-hover);
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

        /* Appearance Controls */
        .appearance-controls {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .theme-mode-selector,
        .accent-color-selector {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .theme-label {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .mode-buttons {
          display: flex;
          gap: 1rem;
        }

        .mode-button {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border: 2px solid var(--border-color);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-primary);
          font-size: 0.9rem;
          font-weight: 500;
        }

        .mode-button:hover {
          background: var(--hover-bg);
          transform: translateY(-2px);
        }

        .mode-button.active {
          border-color: var(--accent-color);
          background: var(--accent-light);
          color: var(--accent-color);
        }

        /* Security Section */
        .security-action {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 2rem;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
        }

        .action-info {
          flex: 1;
        }
      `}</style>
    </div>
  );
}
