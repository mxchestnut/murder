import { useState, useEffect } from 'react';
import { Users, Shield, Trash2, Database, Loader, Gift, X } from 'lucide-react';
import { api } from '../utils/api';

interface UserWithStats {
  id: number;
  username: string;
  email: string | null;
  isAdmin: boolean;
  discordUserId: string | null;
  pathCompanionUsername: string | null;
  pathCompanionConnectedAt: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionStatus: string | null;
  subscriptionEndsAt: Date | null;
  createdAt: Date;
  characterCount: number;
  documentCount: number;
}

interface PlatformStats {
  users: number;
  characters: number;
  documents: number;
  admins: number;
}

interface SubscriptionModalState {
  user: UserWithStats | null;
  status: string;
  endsAt: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [subscriptionModal, setSubscriptionModal] = useState<SubscriptionModalState | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/stats'),
      ]);
      setUsers(usersRes.data.users);
      setStats(statsRes.data);
    } catch (error: any) {
      console.error('Failed to load admin data:', error);
      if (error.response?.status === 403) {
        setMessage({ type: 'error', text: 'Access denied. Admin privileges required.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: number) => {
    try {
      await api.post(`/admin/users/${userId}/toggle-admin`);
      setMessage({ type: 'success', text: 'Admin status updated' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update admin status' });
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      setMessage({ type: 'success', text: `User "${username}" deleted` });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete user' });
    }
  };

  const handleOpenSubscriptionModal = (user: UserWithStats) => {
    const defaultEndsAt = user.subscriptionEndsAt
      ? new Date(user.subscriptionEndsAt).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days from now

    setSubscriptionModal({
      user,
      status: user.stripeSubscriptionStatus || 'active',
      endsAt: defaultEndsAt
    });
  };

  const handleSaveSubscription = async () => {
    if (!subscriptionModal?.user) return;

    try {
      await api.post(`/admin/users/${subscriptionModal.user.id}/subscription`, {
        status: subscriptionModal.status,
        endsAt: subscriptionModal.endsAt
      });
      setMessage({ type: 'success', text: 'Subscription updated successfully' });
      setSubscriptionModal(null);
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update subscription' });
    }
  };

  const handleRemoveSubscription = async () => {
    if (!subscriptionModal?.user) return;

    if (!confirm(`Remove subscription for ${subscriptionModal.user.username}?`)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${subscriptionModal.user.id}/subscription`);
      setMessage({ type: 'success', text: 'Subscription removed' });
      setSubscriptionModal(null);
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove subscription' });
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <Loader style={{ animation: 'spin 1s linear infinite' }} size={32} color="var(--accent-color)" />
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      minHeight: '100vh',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '2rem',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Shield size={32} color="var(--accent-color)" />
          Admin Panel
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage users, monitor platform activity, and troubleshoot accounts
        </p>
      </div>

      {message && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          borderRadius: '8px',
          background: message.type === 'success' ? '#10b98120' : '#ef444420',
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: message.type === 'success' ? '#10b981' : '#ef4444'
        }}>
          {message.text}
        </div>
      )}

      {/* Platform Stats */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <StatCard icon={<Users size={24} />} label="Total Users" value={stats.users} />
          <StatCard icon={<Shield size={24} />} label="Admins" value={stats.admins} />
          <StatCard icon={<Database size={24} />} label="Characters" value={stats.characters} />
          <StatCard icon={<Database size={24} />} label="Documents" value={stats.documents} />
        </div>
      )}

      {/* Users Table */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          fontWeight: 600
        }}>
          Users ({users.length})
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={tableHeaderStyle}>ID</th>
                <th style={tableHeaderStyle}>Username</th>
                <th style={tableHeaderStyle}>Email</th>
                <th style={tableHeaderStyle}>Subscription</th>
                <th style={tableHeaderStyle}>Discord</th>
                <th style={tableHeaderStyle}>PathCompanion</th>
                <th style={tableHeaderStyle}>Characters</th>
                <th style={tableHeaderStyle}>Documents</th>
                <th style={tableHeaderStyle}>Created</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    background: user.isAdmin ? 'var(--accent-light)' : 'transparent'
                  }}
                >
                  <td style={tableCellStyle}>{user.id}</td>
                  <td style={tableCellStyle}>
                    {user.username}
                    {user.isAdmin && (
                      <span style={{
                        marginLeft: '0.5rem',
                        padding: '2px 6px',
                        fontSize: '0.75rem',
                        background: 'var(--accent-color)',
                        color: 'var(--accent-text)',
                        borderRadius: '4px'
                      }}>
                        ADMIN
                      </span>
                    )}
                  </td>
                  <td style={tableCellStyle}>{user.email || '-'}</td>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div>
                        {user.stripeSubscriptionStatus ? (
                          <span style={{
                            padding: '2px 8px',
                            fontSize: '0.75rem',
                            background: user.stripeSubscriptionStatus === 'active' ? '#10b98120' : '#ef444420',
                            color: user.stripeSubscriptionStatus === 'active' ? '#10b981' : '#ef4444',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}>
                            {user.stripeSubscriptionStatus}
                          </span>
                        ) : '-'}
                        {user.subscriptionEndsAt && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {new Date(user.subscriptionEndsAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleOpenSubscriptionModal(user)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.875rem',
                          background: 'var(--accent-color)',
                          color: 'var(--accent-text)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                        title="Gift/Edit Subscription"
                      >
                        <Gift size={14} />
                      </button>
                    </div>
                  </td>
                  <td style={tableCellStyle}>{user.discordUserId ? '✓' : '-'}</td>
                  <td style={tableCellStyle}>{user.pathCompanionUsername || '-'}</td>
                  <td style={tableCellStyle}>{user.characterCount}</td>
                  <td style={tableCellStyle}>{user.documentCount}</td>
                  <td style={tableCellStyle}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleToggleAdmin(user.id)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.875rem',
                          background: user.isAdmin ? 'var(--bg-tertiary)' : 'var(--accent-color)',
                          color: user.isAdmin ? 'var(--text-primary)' : 'var(--accent-text)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Shield size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.875rem',
                          background: '#ef444420',
                          color: '#ef4444',
                          border: '1px solid #ef4444',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Modal */}
      {subscriptionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gift size={24} color="var(--accent-color)" />
                Manage Subscription: {subscriptionModal.user.username}
              </h2>
              <button
                onClick={() => setSubscriptionModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                Status
              </label>
              <select
                value={subscriptionModal.status}
                onChange={(e) => setSubscriptionModal({ ...subscriptionModal, status: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  fontSize: '1rem'
                }}
              >
                <option value="active">Active</option>
                <option value="canceled">Canceled</option>
                <option value="past_due">Past Due</option>
                <option value="unpaid">Unpaid</option>
                <option value="trialing">Trialing</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                Expires At
              </label>
              <input
                type="date"
                value={subscriptionModal.endsAt}
                onChange={(e) => setSubscriptionModal({ ...subscriptionModal, endsAt: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleSaveSubscription}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'var(--accent-color)',
                  color: 'var(--accent-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Save Subscription
              </button>
              {subscriptionModal.user.stripeSubscriptionStatus && (
                <button
                  onClick={handleRemoveSubscription}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#ef444420',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      padding: '1.5rem',
      borderRadius: '8px',
      border: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      <div style={{ color: 'var(--accent-color)' }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        {label}
      </div>
    </div>
  );
}

const tableHeaderStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--text-secondary)'
};

const tableCellStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  color: 'var(--text-primary)'
};
