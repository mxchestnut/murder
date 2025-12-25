import { useState, useEffect } from 'react';
import { Calendar, Clock, MessageCircle, Target, TrendingUp, CheckCircle, Circle } from 'lucide-react';
import { api } from '../utils/api';

interface CharacterAnalyticsProps {
  character: any;
}

export default function CharacterAnalytics({ character }: CharacterAnalyticsProps) {
  const [memories, setMemories] = useState<any[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(true);

  useEffect(() => {
    loadMemories();
  }, [character.id]);

  const loadMemories = async () => {
    try {
      setLoadingMemories(true);
      const response = await api.get(`/memories/${character.id}/memories`);
      setMemories(response.data);
    } catch (error) {
      console.error('Failed to load memories:', error);
    } finally {
      setLoadingMemories(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSince = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Calculate bio field completion
  const bioFields = [
    'fullName', 'titles', 'species', 'ageDescription', 'culturalBackground',
    'pronouns', 'genderIdentity', 'sexuality', 'occupation', 'currentLocation',
    'currentGoal', 'longTermDesire', 'coreMotivation', 'deepestFear',
    'personalityOneSentence', 'keyVirtues', 'keyFlaws', 'physicalPresence',
    'identifyingTraits', 'clothingAesthetic', 'origin', 'importantRelationships'
  ];

  const completedFields = bioFields.filter(field => character[field] && character[field].trim().length > 0).length;
  const completionPercentage = Math.round((completedFields / bioFields.length) * 100);

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={24} />
          Character Analytics
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Track {character.name}'s development and activity
        </p>
      </div>

      <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
        {/* Basic Stats */}
        <div style={{
          background: 'var(--bg-secondary)',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Basic Information
          </h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Calendar size={18} style={{ color: 'var(--accent-color)' }} />
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Created</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {formatDate(character.createdAt)} ({getTimeSince(character.createdAt)})
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Clock size={18} style={{ color: 'var(--accent-color)' }} />
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Last Updated</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {formatDate(character.updatedAt)} ({getTimeSince(character.updatedAt)})
                </div>
              </div>
            </div>
            {character.isPathCompanion && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Target size={18} style={{ color: 'var(--accent-color)' }} />
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Last PathCompanion Sync</div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {formatDate(character.lastSynced)} ({getTimeSince(character.lastSynced)})
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Memory Stats */}
        <div style={{
          background: 'var(--bg-secondary)',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Memory Stats
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MessageCircle size={18} style={{ color: 'var(--accent-color)' }} />
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Memories</div>
              <div style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                {loadingMemories ? '...' : memories.length}
              </div>
            </div>
          </div>
        </div>

        {/* Bio Completion */}
        <div style={{
          background: 'var(--bg-secondary)',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Bio Completion
          </h3>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {completedFields} of {bioFields.length} fields completed
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: 600 }}>
                {completionPercentage}%
              </span>
            </div>
            <div style={{
              height: '8px',
              background: 'var(--bg-tertiary)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${completionPercentage}%`,
                background: completionPercentage === 100 ? '#10b981' : 'var(--accent-color)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {completionPercentage === 100 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                <CheckCircle size={16} />
                Bio fully completed!
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Circle size={16} />
                Fill in more bio fields to complete the profile
              </div>
            )}
          </div>
        </div>

        {/* Character Details */}
        <div style={{
          background: 'var(--bg-secondary)',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Character Details
          </h3>
          <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Level:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{character.level || 'N/A'}</span>
            </div>
            {character.characterClass && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Class:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{character.characterClass}</span>
              </div>
            )}
            {character.race && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Race:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{character.race}</span>
              </div>
            )}
            {character.alignment && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Alignment:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{character.alignment}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>PathCompanion:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {character.isPathCompanion ? '✓ Linked' : '✗ Not linked'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
