import { useState, useEffect } from 'react';
import { api } from '../utils/api';

interface HallOfFameMessage {
  id: number;
  messageId: string;
  channelId: string;
  guildId: string;
  authorId: string;
  characterName: string | null;
  content: string;
  starCount: number;
  contextMessages: Array<{ author: string; content: string; timestamp: number }>;
  hallMessageId: string | null;
  addedToHallAt: string;
}

interface HallOfFameStats {
  totalMessages: number;
  totalStars: number;
  topMessage: HallOfFameMessage | null;
  characterStats: Array<{
    characterName: string;
    count: number;
    totalStars: number;
  }>;
  recentAdditions: HallOfFameMessage[];
}

export default function HallOfFameGallery() {
  const [messages, setMessages] = useState<HallOfFameMessage[]>([]);
  const [stats, setStats] = useState<HallOfFameStats | null>(null);
  const [randomGem, setRandomGem] = useState<HallOfFameMessage | null>(null);
  const [characters, setCharacters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'gallery' | 'stats'>('gallery');

  // Filters
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [minStars, setMinStars] = useState<number>(10);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Export state
  const [exportFormat, setExportFormat] = useState<'text' | 'markdown'>('text');

  useEffect(() => {
    loadMessages();
    loadCharacters();
    loadStats();
  }, [selectedCharacter, minStars, startDate, endDate, offset]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });

      if (selectedCharacter) params.append('character', selectedCharacter);
      if (minStars > 0) params.append('minStars', minStars.toString());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/hall-of-fame/list?${params}`);
      setMessages(response.data.messages);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to load Hall of Fame:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCharacters = async () => {
    try {
      const response = await api.get('/hall-of-fame/characters');
      setCharacters(response.data.characters);
    } catch (error) {
      console.error('Failed to load characters:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/hall-of-fame/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadRandomGem = async () => {
    try {
      const params = minStars > 0 ? `?minStars=${minStars}` : '';
      const response = await api.get(`/hall-of-fame/random${params}`);
      setRandomGem(response.data.message);
    } catch (error) {
      console.error('Failed to load random gem:', error);
    }
  };

  const clearFilters = () => {
    setSelectedCharacter('');
    setMinStars(10);
    setStartDate('');
    setEndDate('');
    setOffset(0);
  };

  const exportMessages = () => {
    if (exportFormat === 'text') {
      const text = messages.map(msg => {
        const date = new Date(msg.addedToHallAt).toLocaleDateString();
        const author = msg.characterName || 'Unknown';
        return `[${date}] ${author} (⭐ ${msg.starCount})\n${msg.content}\n\n`;
      }).join('---\n\n');

      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hall-of-fame-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Markdown format
      let markdown = '# Hall of Fame\n\n';
      messages.forEach(msg => {
        const date = new Date(msg.addedToHallAt).toLocaleDateString();
        const author = msg.characterName || 'Unknown';
        markdown += `## ${author} - ${date}\n\n`;
        markdown += `**⭐ ${msg.starCount} stars**\n\n`;
        markdown += `> ${msg.content}\n\n`;
        if (msg.contextMessages && msg.contextMessages.length > 0) {
          markdown += `### Context\n\n`;
          msg.contextMessages.forEach(ctx => {
            markdown += `- **${ctx.author}**: ${ctx.content}\n`;
          });
          markdown += '\n';
        }
        markdown += '---\n\n';
      });

      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hall-of-fame-${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const copyToClipboard = (message: HallOfFameMessage) => {
    const text = `"${message.content}"\n\n— ${message.characterName || 'Unknown'} (⭐ ${message.starCount})`;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && messages.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Hall of Fame...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⭐ Hall of Fame Gallery
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Epic moments with 10+ stars, immortalized forever
        </p>
      </div>

      {/* View Toggle */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setView('gallery')}
          style={{
            padding: '0.5rem 1rem',
            background: view === 'gallery' ? 'var(--primary-color)' : 'var(--bg-secondary)',
            color: view === 'gallery' ? 'white' : 'var(--text-primary)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          🖼️ Gallery
        </button>
        <button
          onClick={() => setView('stats')}
          style={{
            padding: '0.5rem 1rem',
            background: view === 'stats' ? 'var(--primary-color)' : 'var(--bg-secondary)',
            color: view === 'stats' ? 'white' : 'var(--text-primary)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Stats
        </button>
      </div>

      {view === 'gallery' ? (
        <>
          {/* Filters */}
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
              {/* Character Filter */}
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Character
                </label>
                <select
                  value={selectedCharacter}
                  onChange={(e) => { setSelectedCharacter(e.target.value); setOffset(0); }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="">All Characters</option>
                  {characters.map(char => (
                    <option key={char} value={char}>{char}</option>
                  ))}
                </select>
              </div>

              {/* Min Stars Filter */}
              <div style={{ flex: '1', minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Min Stars
                </label>
                <input
                  type="number"
                  min="0"
                  value={minStars}
                  onChange={(e) => { setMinStars(parseInt(e.target.value) || 0); setOffset(0); }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Date Range */}
              <div style={{ flex: '1', minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setOffset(0); }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div style={{ flex: '1', minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setOffset(0); }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={clearFilters}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Clear
                </button>
                <button
                  onClick={loadRandomGem}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: '500'
                  }}
                >
                  💎 Random Gem
                </button>
              </div>
            </div>

            {/* Export Options */}
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ fontWeight: '500' }}>Export:</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'text' | 'markdown')}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="text">Plain Text</option>
                <option value="markdown">Markdown</option>
              </select>
              <button
                onClick={exportMessages}
                disabled={messages.length === 0}
                style={{
                  padding: '0.5rem 1rem',
                  background: messages.length > 0 ? 'var(--success-color)' : 'var(--bg-tertiary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: messages.length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: '500'
                }}
              >
                📥 Download ({messages.length})
              </button>
            </div>
          </div>

          {/* Random Gem Modal */}
          {randomGem && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '2rem'
              }}
              onClick={() => setRandomGem(null)}
            >
              <div
                style={{
                  background: 'var(--bg-primary)',
                  padding: '2rem',
                  borderRadius: '12px',
                  maxWidth: '600px',
                  width: '100%',
                  border: '3px solid gold',
                  boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💎 Gem from the Vault</h2>
                  <div style={{ fontSize: '2rem', color: 'gold' }}>{'⭐'.repeat(Math.min(randomGem.starCount, 5))}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    {randomGem.starCount} stars
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  borderLeft: '4px solid gold'
                }}>
                  <p style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                    "{randomGem.content}"
                  </p>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    — {randomGem.characterName || 'Unknown'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    {formatDate(randomGem.addedToHallAt)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button
                    onClick={() => copyToClipboard(randomGem)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={loadRandomGem}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'var(--success-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Another
                  </button>
                  <button
                    onClick={() => setRandomGem(null)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results Info */}
          <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            Showing {messages.length} of {total} messages
          </div>

          {/* Gallery Grid */}
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⭐</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No Hall of Fame messages yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Star messages in Discord to see them here!
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {messages.map(message => (
                <div
                  key={message.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    position: 'relative',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Star Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                    color: '#000',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    ⭐ {message.starCount}
                  </div>

                  {/* Content */}
                  <div style={{ marginBottom: '1rem', paddingRight: '4rem' }}>
                    <p style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                      {message.content}
                    </p>
                  </div>

                  {/* Author & Date */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {message.characterName || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {formatDate(message.addedToHallAt)}
                    </div>
                  </div>

                  {/* Context Messages */}
                  {message.contextMessages && message.contextMessages.length > 0 && (
                    <div style={{
                      background: 'var(--bg-tertiary)',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                        Context
                      </div>
                      {message.contextMessages.slice(0, 2).map((ctx, idx) => (
                        <div key={idx} style={{ marginBottom: '0.5rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--border-color)' }}>
                          <div style={{ fontWeight: '500' }}>{ctx.author}</div>
                          <div style={{ color: 'var(--text-secondary)' }}>
                            {ctx.content.substring(0, 100)}{ctx.content.length > 100 ? '...' : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => copyToClipboard(message)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '500'
                      }}
                    >
                      📋 Copy Quote
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > limit && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                style={{
                  padding: '0.5rem 1rem',
                  background: offset === 0 ? 'var(--bg-tertiary)' : 'var(--primary-color)',
                  color: offset === 0 ? 'var(--text-secondary)' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: offset === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Previous
              </button>
              <div style={{ padding: '0.5rem 1rem', color: 'var(--text-secondary)' }}>
                Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
              </div>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                style={{
                  padding: '0.5rem 1rem',
                  background: offset + limit >= total ? 'var(--bg-tertiary)' : 'var(--primary-color)',
                  color: offset + limit >= total ? 'var(--text-secondary)' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: offset + limit >= total ? 'not-allowed' : 'pointer'
                }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        /* Stats View */
        <div>
          {stats && (
            <>
              {/* Overview Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalMessages}</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Messages</div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalStars}</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Stars</div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                  color: '#000',
                  padding: '1.5rem',
                  borderRadius: '12px'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.topMessage?.starCount || 0}</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Highest Stars</div>
                </div>
              </div>

              {/* Top Message */}
              {stats.topMessage && (
                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  marginBottom: '2rem',
                  border: '2px solid gold'
                }}>
                  <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🏆 Top Message ({stats.topMessage.starCount} stars)
                  </h3>
                  <p style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '0.5rem' }}>
                    "{stats.topMessage.content}"
                  </p>
                  <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    — {stats.topMessage.characterName || 'Unknown'}
                  </div>
                </div>
              )}

              {/* Character Leaderboard */}
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                border: '1px solid var(--border-color)'
              }}>
                <h3 style={{ marginBottom: '1rem' }}>Character Leaderboard</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem' }}>Rank</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem' }}>Character</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem' }}>Messages</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem' }}>Total Stars</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem' }}>Avg Stars</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.characterStats.map((char, idx) => (
                      <tr key={char.characterName} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem' }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: '600' }}>{char.characterName}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{char.count}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>⭐ {char.totalStars}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          {(char.totalStars / char.count).toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Recent Additions */}
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}>
                <h3 style={{ marginBottom: '1rem' }}>🆕 Recent Additions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {stats.recentAdditions.map(msg => (
                    <div
                      key={msg.id}
                      style={{
                        background: 'var(--bg-tertiary)',
                        padding: '1rem',
                        borderRadius: '8px',
                        borderLeft: '3px solid gold'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: '600' }}>{msg.characterName || 'Unknown'}</div>
                        <div style={{ color: 'gold', fontWeight: 'bold' }}>⭐ {msg.starCount}</div>
                      </div>
                      <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        {msg.content.substring(0, 150)}{msg.content.length > 150 ? '...' : ''}
                      </p>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {formatDate(msg.addedToHallAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
