import { useState, useEffect } from 'react';
import { Bot, ExternalLink, CheckCircle, Info } from 'lucide-react';
import { api } from '../utils/api';

interface UserProfile {
  subscriptionTier: string;
  stripeSubscriptionStatus: string | null;
}

export default function DiscordBotInvite() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Write Pretend bot OAuth2 invite URL with proper permissions
  const WRITE_PRETEND_CLIENT_ID = '1324581405509091341';
  const WRITE_PRETEND_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${WRITE_PRETEND_CLIENT_ID}&permissions=534992595008&scope=bot`;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasActiveSubscription = profile?.subscriptionTier === 'rp' &&
    (profile?.stripeSubscriptionStatus === 'active' || profile?.stripeSubscriptionStatus === 'trialing');

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      minHeight: '100vh',
      maxWidth: '900px',
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
          <Bot size={32} color="var(--accent-color)" />
          Write Pretend Discord Bot
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Invite Write Pretend to your Discord server for RP tools, dice rolling, and AI features
        </p>
      </div>

      {/* Write Pretend Bot - Unified */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--accent-color)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Bot size={32} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Write Pretend
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              All-in-one RP bot • Free tier + premium RP tier features
            </p>
          </div>
          <CheckCircle size={24} color="#10b981" />
        </div>

        <div style={{
          background: 'var(--bg-primary)',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
            Free Tier Features:
          </h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <li style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#10b981' }}>✓</span> Character proxying
            </li>
            <li style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#10b981' }}>✓</span> Dice rolling
            </li>
            <li style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#10b981' }}>✓</span> Character stats & profiles
            </li>
            <li style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#10b981' }}>✓</span> Leaderboards
            </li>
            <li style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#10b981' }}>✓</span> Hall of Fame (⭐ reactions)
            </li>
            <li style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#10b981' }}>✓</span> GM tools (time, notes, NPCs)
            </li>
          </ul>

          {hasActiveSubscription && (
            <>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>
                RP Tier Features (Active):
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.5rem'
              }}>
                <li style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#ff6b6b' }}>✨</span> AI knowledge base
                </li>
                <li style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#ff6b6b' }}>✨</span> RP prompts & tropes
                </li>
                <li style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#ff6b6b' }}>✨</span> Character memories
                </li>
                <li style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#ff6b6b' }}>✨</span> Character relationships
                </li>
                <li style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#ff6b6b' }}>✨</span> World building lore
                </li>
                <li style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#ff6b6b' }}>✨</span> D&D feats & spells
                </li>
              </ul>
            </>
          )}
        </div>

        {!hasActiveSubscription && (
          <div style={{
            background: '#3b82f620',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'start',
            gap: '0.75rem'
          }}>
            <Info size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                <strong>Unlock RP Tier features with a subscription!</strong>
              </p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Upgrade to access AI-powered knowledge base, character memories, relationships, lore tracking, and more.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => window.open(WRITE_PRETEND_INVITE_URL, '_blank')}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <ExternalLink size={20} />
          Invite Write Pretend Bot
        </button>
      </div>

      {!hasActiveSubscription && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Want RP Tier Features?</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Upgrade to unlock AI knowledge base, character memories, lore tracking, and more!
          </p>
          <button
            onClick={() => window.location.href = '/settings?tab=subscription'}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--accent-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            View Subscription Plans
          </button>
        </div>
      )}

      {/* Info Section */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginTop: '2rem'
      }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Info size={20} color="var(--accent-color)" />
          Setup Instructions
        </h3>
        <ol style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.8' }}>
          <li>Click the invite button for the bot you want to add</li>
          <li>Select your Discord server from the dropdown</li>
          <li>Review the bot permissions and click "Authorize"</li>
          <li>Use <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-color)' }}>!help</code> in Discord to see available commands</li>
          <li>Connect your account with <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-color)' }}>!connect username password</code></li>
        </ol>
      </div>
    </div>
  );
}
