import { useState, useEffect } from 'react';
import { User, Heart, Calendar, Ruler, Weight, Palette, Smile, BookOpen, Save } from 'lucide-react';
import { api } from '../utils/api';

interface CharacterBioProps {
  character: any;
  onUpdate: () => void;
}

export default function CharacterBio({ character, onUpdate }: CharacterBioProps) {
  const [bioData, setBioData] = useState({
    pronouns: character.pronouns || '',
    sexuality: character.sexuality || '',
    age: character.age || '',
    height: character.height || '',
    weight: character.weight || '',
    appearance: character.appearance || '',
    personality: character.personality || '',
    backstory: character.backstory || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setBioData({
      pronouns: character.pronouns || '',
      sexuality: character.sexuality || '',
      age: character.age || '',
      height: character.height || '',
      weight: character.weight || '',
      appearance: character.appearance || '',
      personality: character.personality || '',
      backstory: character.backstory || ''
    });
  }, [character]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      await api.put(`/characters/${character.id}`, bioData);
      setMessage({ type: 'success', text: 'Bio saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
      onUpdate();
    } catch (error) {
      console.error('Error saving bio:', error);
      setMessage({ type: 'error', text: 'Failed to save bio' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setBioData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{
      padding: '1.5rem',
      background: 'var(--bg-primary)',
      borderRadius: '8px',
      border: '1px solid var(--border-color)',
      marginBottom: '1.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={20} />
          Character Bio
        </h3>
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: isSaving ? 'var(--bg-tertiary)' : 'var(--accent-color)',
            color: isSaving ? 'var(--text-secondary)' : 'var(--accent-text)',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: 500
          }}
        >
          <Save size={16} />
          {isSaving ? 'Saving...' : 'Save Bio'}
        </button>
      </div>

      {message && (
        <div style={{
          padding: '0.75rem',
          marginBottom: '1rem',
          borderRadius: '6px',
          background: message.type === 'success' ? 'var(--accent-light)' : '#fee',
          color: message.type === 'success' ? 'var(--accent-color)' : '#c33',
          fontSize: '0.9rem',
          border: `1px solid ${message.type === 'success' ? 'var(--accent-color)' : '#c33'}`
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>
            <User size={14} />
            Pronouns
          </label>
          <input
            type="text"
            value={bioData.pronouns}
            onChange={(e) => handleChange('pronouns', e.target.value)}
            placeholder="he/him, she/her, they/them..."
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>
            <Heart size={14} />
            Sexuality
          </label>
          <input
            type="text"
            value={bioData.sexuality}
            onChange={(e) => handleChange('sexuality', e.target.value)}
            placeholder="straight, gay, bi, ace..."
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>
            <Calendar size={14} />
            Age
          </label>
          <input
            type="text"
            value={bioData.age}
            onChange={(e) => handleChange('age', e.target.value)}
            placeholder="25, appears 30, etc..."
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>
            <Ruler size={14} />
            Height
          </label>
          <input
            type="text"
            value={bioData.height}
            onChange={(e) => handleChange('height', e.target.value)}
            placeholder="5'10&quot;, 178cm..."
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>
            <Weight size={14} />
            Weight
          </label>
          <input
            type="text"
            value={bioData.weight}
            onChange={(e) => handleChange('weight', e.target.value)}
            placeholder="180 lbs, 82 kg..."
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem'
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>
          <Palette size={14} />
          Appearance
        </label>
        <textarea
          value={bioData.appearance}
          onChange={(e) => handleChange('appearance', e.target.value)}
          placeholder="Physical description, clothing, distinguishing features..."
          rows={3}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>
          <Smile size={14} />
          Personality
        </label>
        <textarea
          value={bioData.personality}
          onChange={(e) => handleChange('personality', e.target.value)}
          placeholder="Personality traits, mannerisms, quirks..."
          rows={3}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>
          <BookOpen size={14} />
          Backstory
        </label>
        <textarea
          value={bioData.backstory}
          onChange={(e) => handleChange('backstory', e.target.value)}
          placeholder="Character history, motivations, goals..."
          rows={4}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
      </div>
    </div>
  );
}
