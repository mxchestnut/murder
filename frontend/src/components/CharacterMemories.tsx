import { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus, Save, X } from 'lucide-react';
import { api } from '../utils/api';

interface Memory {
  id: number;
  memory: string;
  addedBy: string;
  createdAt: string;
}

interface CharacterMemoriesProps {
  characterId: number;
  characterName: string;
  guildId?: string;
}

export default function CharacterMemories({ characterId, characterName, guildId }: CharacterMemoriesProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMemory, setNewMemory] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    loadMemories();
  }, [characterId]);

  const loadMemories = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/memories/${characterId}/memories`);
      setMemories(response.data);
    } catch (error) {
      console.error('Failed to load memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMemory = async () => {
    if (!newMemory.trim()) return;

    try {
      const response = await api.post(`/memories/${characterId}/memories`, {
        memory: newMemory,
        guildId: guildId || ''
      });
      setMemories([response.data, ...memories]);
      setNewMemory('');
    } catch (error) {
      console.error('Failed to add memory:', error);
      alert('Failed to add memory');
    }
  };

  const deleteMemory = async (memoryId: number) => {
    if (!confirm('Delete this memory?')) return;

    try {
      await api.delete(`/memories/memories/${memoryId}`);
      setMemories(memories.filter(m => m.id !== memoryId));
    } catch (error) {
      console.error('Failed to delete memory:', error);
      alert('Failed to delete memory');
    }
  };

  const startEdit = (memory: Memory) => {
    setEditingId(memory.id);
    setEditText(memory.memory);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async (memoryId: number) => {
    if (!editText.trim()) return;

    try {
      const response = await api.put(`/memories/memories/${memoryId}`, {
        memory: editText
      });
      setMemories(memories.map(m => m.id === memoryId ? response.data : m));
      setEditingId(null);
      setEditText('');
    } catch (error) {
      console.error('Failed to update memory:', error);
      alert('Failed to update memory');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading memories...</div>;
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📝 {characterName}'s Memories
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Track important moments and character development
        </p>
      </div>

      {/* Add New Memory */}
      <div style={{
        background: 'var(--bg-secondary)',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} />
          Add New Memory
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <textarea
            value={newMemory}
            onChange={(e) => setNewMemory(e.target.value)}
            placeholder="Had a dream about meeting their soulmate..."
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              minHeight: '80px',
              resize: 'vertical'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Discord: <code>!Memory {characterName} | [your memory]</code>
            </span>
            <button
              onClick={addMemory}
              disabled={!newMemory.trim()}
              style={{
                padding: '0.5rem 1rem',
                background: newMemory.trim() ? 'var(--primary-color)' : 'var(--bg-tertiary)',
                color: newMemory.trim() ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '6px',
                cursor: newMemory.trim() ? 'pointer' : 'not-allowed',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Plus size={16} />
              Add Memory
            </button>
          </div>
        </div>
      </div>

      {/* Memories List */}
      {memories.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px dashed var(--border-color)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No memories yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Add the first memory to track {characterName}'s journey
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            {memories.length} {memories.length === 1 ? 'memory' : 'memories'}
          </div>
          {memories.map((memory, index) => (
            <div
              key={memory.id}
              style={{
                background: 'var(--bg-secondary)',
                padding: '1.25rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                position: 'relative'
              }}
            >
              {/* Memory Number Badge */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                background: 'var(--primary-color)',
                color: 'white',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 'bold'
              }}>
                {index + 1}
              </div>

              <div style={{ paddingLeft: '3rem' }}>
                {editingId === memory.id ? (
                  /* Edit Mode */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.95rem',
                        minHeight: '80px',
                        resize: 'vertical'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => saveEdit(memory.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'var(--success-color)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Save size={16} />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <p style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                      {memory.memory}
                    </p>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Added {formatDate(memory.createdAt)}
                        {memory.addedBy !== 'portal' && (
                          <span style={{ marginLeft: '0.5rem' }}>• Discord</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => startEdit(memory)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.85rem'
                          }}
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteMemory(memory.id)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            background: 'var(--danger-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.85rem'
                          }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
