import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { BookOpen, Search, Plus, Edit, Trash2, X, Tag, TrendingUp, Sparkles, User } from 'lucide-react';
import TiptapField from './TiptapField';
import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

interface KnowledgeEntry {
  id: number;
  question: string;
  answer: string;
  answerHtml: string | null;
  sourceUrl: string | null;
  category: string | null;
  aiGenerated: boolean;
  createdBy: number | null;
  upvotes: number;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  aiGenerated: number;
  manual: number;
  categories: { name: string; count: number }[];
}

export default function KnowledgeBase() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAiOnly, setShowAiOnly] = useState(false);
  const [showManualOnly, setShowManualOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    question: '',
    answerHtml: '',
    sourceUrl: '',
    category: ''
  });

  useEffect(() => {
    loadEntries();
    loadStats();
  }, [searchTerm, selectedCategory, showAiOnly, showManualOnly]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const params: any = {};

      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;
      if (showAiOnly) params.aiGenerated = 'true';
      if (showManualOnly) params.aiGenerated = 'false';

      const response = await api.get('/knowledge-base', { params });
      setEntries(response.data.entries);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/knowledge-base/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Convert HTML to markdown for Discord
      const markdown = turndownService.turndown(formData.answerHtml);

      const payload = {
        question: formData.question,
        answer: markdown,
        answerHtml: formData.answerHtml,
        sourceUrl: formData.sourceUrl,
        category: formData.category
      };

      if (editingEntry) {
        await api.put(`/knowledge-base/${editingEntry.id}`, payload);
      } else {
        await api.post('/knowledge-base', payload);
      }

      setShowModal(false);
      setEditingEntry(null);
      setFormData({ question: '', answerHtml: '', sourceUrl: '', category: '' });
      loadEntries();
      loadStats();
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry');
    }
  };

  const handleEdit = (entry: KnowledgeEntry) => {
    setEditingEntry(entry);
    setFormData({
      question: entry.question,
      answerHtml: entry.answerHtml || entry.answer, // Use HTML if available, fallback to markdown
      sourceUrl: entry.sourceUrl || '',
      category: entry.category || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      await api.delete(`/knowledge-base/${id}`);
      loadEntries();
      loadStats();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEntry(null);
    setFormData({ question: '', answerHtml: '', sourceUrl: '', category: '' });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={24} color="var(--accent-primary)" />
            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Knowledge Base</h2>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--accent-color)',
              color: 'var(--accent-text)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '500'
            }}
          >
            <Plus size={18} />
            Add Entry
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              padding: '1rem',
              background: 'var(--bg-primary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <TrendingUp size={16} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Entries</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {stats.total}
              </div>
            </div>
            <div style={{
              padding: '1rem',
              background: 'var(--bg-primary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Sparkles size={16} color="var(--accent-secondary)" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>AI Generated</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {stats.aiGenerated}
              </div>
            </div>
            <div style={{
              padding: '1rem',
              background: 'var(--bg-primary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <User size={16} color="var(--accent-tertiary)" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Manual Entries</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {stats.manual}
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)'
              }}
            />
            <input
              type="text"
              placeholder="Search questions and answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <option value="">All Categories</option>
            {stats?.categories.map(cat => (
              <option key={cat.name} value={cat.name}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={showAiOnly}
                onChange={(e) => {
                  setShowAiOnly(e.target.checked);
                  if (e.target.checked) setShowManualOnly(false);
                }}
              />
              AI Only
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={showManualOnly}
                onChange={(e) => {
                  setShowManualOnly(e.target.checked);
                  if (e.target.checked) setShowAiOnly(false);
                }}
              />
              Manual Only
            </label>
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            Loading...
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            No entries found. Try adjusting your filters or add a new entry.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {entries.map(entry => (
              <div
                key={entry.id}
                style={{
                  padding: '1.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.125rem' }}>
                        {entry.question}
                      </h3>
                      {entry.aiGenerated && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: 'var(--accent-secondary)',
                          color: 'white',
                          fontSize: '0.75rem',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <Sparkles size={12} />
                          AI
                        </span>
                      )}
                      {entry.category && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: 'var(--accent-tertiary)',
                          color: 'white',
                          fontSize: '0.75rem',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <Tag size={12} />
                          {entry.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEdit(entry)}
                      style={{
                        padding: '0.5rem',
                        background: 'var(--accent-color)',
                        color: 'var(--accent-text)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      style={{
                        padding: '0.5rem',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    margin: '0 0 0.75rem 0',
                    color: 'var(--text-primary)',
                    lineHeight: '1.6'
                  }}
                  dangerouslySetInnerHTML={{ __html: entry.answerHtml || entry.answer }}
                />

                {entry.sourceUrl && (
                  <a
                    href={entry.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--accent-primary)',
                      fontSize: '0.875rem',
                      textDecoration: 'none'
                    }}
                  >
                    Source Link →
                  </a>
                )}

                <div style={{
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)'
                }}>
                  Added {new Date(entry.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
                {editingEntry ? 'Edit Entry' : 'New Entry'}
              </h3>
              <button
                onClick={handleCloseModal}
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

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                  Question *
                </label>
                <input
                  type="text"
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <TiptapField
                  label="Answer *"
                  value={formData.answerHtml}
                  onChange={(html) => setFormData({ ...formData, answerHtml: html })}
                  placeholder="Enter the answer with rich formatting..."
                  maxLength={10000}
                  rows={10}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Rules, Lore, Character Creation"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                  Source URL
                </label>
                <input
                  type="url"
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--accent-color)',
                    color: 'var(--accent-text)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {editingEntry ? 'Save Changes' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
