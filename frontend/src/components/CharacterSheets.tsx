import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Dices, 
  Save, 
  X,
  Sword,
  Zap,
  Heart,
  Brain,
  Eye,
  MessageCircle,
  Download,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface CharacterSheet {
  id: number;
  name: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  characterClass?: string;
  level: number;
  isPathCompanion?: boolean;
  pathCompanionId?: string;
  lastSynced?: string;
  modifiers: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
}

const statIcons = {
  strength: Sword,
  dexterity: Zap,
  constitution: Heart,
  intelligence: Brain,
  wisdom: Eye,
  charisma: MessageCircle
};

export default function CharacterSheets() {
  const [sheets, setSheets] = useState<CharacterSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<CharacterSheet | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPathCompanionImport, setShowPathCompanionImport] = useState(false);
  const [shareKey, setShareKey] = useState('');
  const [importingPC, setImportingPC] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    characterClass: '',
    level: 1,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
  });
  const [rollResult, setRollResult] = useState<any>(null);

  useEffect(() => {
    loadSheets();
  }, []);

  const loadSheets = async () => {
    try {
      const response = await api.get('/characters');
      setSheets(response.data);
      if (response.data.length > 0 && !selectedSheet) {
        setSelectedSheet(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading character sheets:', error);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await api.post('/characters', formData);
      setSheets([...sheets, response.data]);
      setSelectedSheet(response.data);
      setIsCreating(false);
      resetForm();
    } catch (error) {
      console.error('Error creating character sheet:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedSheet) return;
    try {
      const response = await api.put(`/characters/${selectedSheet.id}`, formData);
      const updatedSheets = sheets.map(s => s.id === selectedSheet.id ? response.data : s);
      setSheets(updatedSheets);
      setSelectedSheet(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating character sheet:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this character?')) return;
    try {
      await api.delete(`/characters/${id}`);
      const remainingSheets = sheets.filter(s => s.id !== id);
      setSheets(remainingSheets);
      if (selectedSheet?.id === id) {
        setSelectedSheet(remainingSheets[0] || null);
      }
    } catch (error) {
      console.error('Error deleting character sheet:', error);
    }
  };

  const handleRoll = async (stat: string) => {
    if (!selectedSheet) return;
    try {
      const response = await api.post(`/characters/${selectedSheet.id}/roll`, { stat });
      setRollResult(response.data);
      setTimeout(() => setRollResult(null), 5000);
    } catch (error) {
      console.error('Error rolling dice:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      characterClass: '',
      level: 1,
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    });
  };

  const startEdit = () => {
    if (!selectedSheet) return;
    setFormData({
      name: selectedSheet.name,
      characterClass: selectedSheet.characterClass || '',
      level: selectedSheet.level,
      strength: selectedSheet.strength,
      dexterity: selectedSheet.dexterity,
      constitution: selectedSheet.constitution,
      intelligence: selectedSheet.intelligence,
      wisdom: selectedSheet.wisdom,
      charisma: selectedSheet.charisma
    });
    setIsEditing(true);
  };

  // PathCompanion integration handlers
  const importFromShareKey = async () => {
    setImportingPC(true);
    try {
      const response = await api.post('/pathcompanion/character/share', { shareKey });
      const { character } = response.data;
      
      // Save to our database
      const saveResponse = await api.post('/characters', {
        name: character.characterName,
        characterClass: 'Pathfinder 2e',
        level: character.data.level || 1,
        strength: character.data.abilities?.str?.base || 10,
        dexterity: character.data.abilities?.dex?.base || 10,
        constitution: character.data.abilities?.con?.base || 10,
        intelligence: character.data.abilities?.int?.base || 10,
        wisdom: character.data.abilities?.wis?.base || 10,
        charisma: character.data.abilities?.cha?.base || 10,
        pathcompanion_data: character.data,
      });
      
      setSheets([...sheets, saveResponse.data]);
      setSelectedSheet(saveResponse.data);
      setShowPathCompanionImport(false);
      setShareKey('');
      alert(`Successfully imported ${character.characterName}!`);
    } catch (error) {
      console.error('Failed to import PathCompanion character:', error);
      alert(error instanceof Error ? error.message : 'Failed to import character.');
    } finally {
      setImportingPC(false);
    }
  };

  const syncPathCompanionCharacter = async (sheetId: number) => {
    try {
      const response = await api.post(`/pathcompanion/sync/${sheetId}`);
      const updatedSheets = sheets.map(s => s.id === sheetId ? response.data : s);
      setSheets(updatedSheets);
      if (selectedSheet?.id === sheetId) {
        setSelectedSheet(response.data);
      }
      alert('Character synced successfully!');
    } catch (error) {
      console.error('Failed to sync PathCompanion character:', error);
      alert('Failed to sync character with PathCompanion.');
    }
  };

  const StatBlock = ({ stat, value, modifier }: { stat: string; value: number; modifier: number }) => {
    const Icon = statIcons[stat as keyof typeof statIcons];
    const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
    
    return (
      <div className="stat-block">
        <div className="stat-header">
          <Icon size={18} />
          <span>{stat.toUpperCase()}</span>
        </div>
        <div className="stat-value">{value}</div>
        <div className="stat-modifier">{modifierStr}</div>
        <button 
          className="roll-button"
          onClick={() => handleRoll(stat)}
          disabled={!selectedSheet}
        >
          <Dices size={16} />
          Roll
        </button>
      </div>
    );
  };

  return (
    <div className="character-sheets-container">
      <div className="character-list">
        <div className="character-list-header">
          <h2>Characters</h2>
          <div className="character-list-actions">
            <button 
              className="icon-button secondary"
              onClick={() => setShowPathCompanionImport(true)}
              title="Import from PathCompanion"
            >
              <Download size={20} />
            </button>
            <button 
              className="icon-button primary"
              onClick={() => {
                resetForm();
                setIsCreating(true);
                setIsEditing(false);
              }}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
        
        <div className="character-items">
          {sheets.map(sheet => (
            <div 
              key={sheet.id}
              className={`character-item ${selectedSheet?.id === sheet.id ? 'active' : ''}`}
              onClick={() => setSelectedSheet(sheet)}
            >
              <div className="character-item-info">
                <div className="character-name">
                  {sheet.name}
                  {sheet.isPathCompanion && (
                    <span className="pathcompanion-badge" title="PathCompanion Character">
                      <ExternalLink size={12} />
                    </span>
                  )}
                </div>
                <div className="character-meta">
                  {sheet.characterClass && `${sheet.characterClass} `}
                  Level {sheet.level}
                </div>
              </div>
              <div className="character-item-actions">
                {sheet.isPathCompanion && (
                  <button 
                    className="icon-button secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      syncPathCompanionCharacter(sheet.id);
                    }}
                    title="Sync from PathCompanion"
                  >
                    <RefreshCw size={16} />
                  </button>
                )}
                <button 
                  className="icon-button danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(sheet.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="character-sheet-view">
        {(isCreating || isEditing) ? (
          <div className="character-form">
            <h2>{isCreating ? 'Create Character' : 'Edit Character'}</h2>
            
            <div className="form-group">
              <label>Character Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter character name"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Class</label>
                <input
                  type="text"
                  value={formData.characterClass}
                  onChange={(e) => setFormData({ ...formData, characterClass: e.target.value })}
                  placeholder="e.g., Fighter, Wizard"
                />
              </div>
              <div className="form-group">
                <label>Level</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <h3>Ability Scores</h3>
            <div className="stats-grid-form">
              {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map(stat => (
                <div key={stat} className="form-group">
                  <label>{stat.toUpperCase()}</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData[stat]}
                    onChange={(e) => setFormData({ ...formData, [stat]: parseInt(e.target.value) })}
                  />
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button 
                className="button secondary"
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  resetForm();
                }}
              >
                <X size={18} />
                Cancel
              </button>
              <button 
                className="button primary"
                onClick={isCreating ? handleCreate : handleUpdate}
              >
                <Save size={18} />
                {isCreating ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        ) : selectedSheet ? (
          <div className="character-display">
            <div className="character-header">
              <div>
                <h1>{selectedSheet.name}</h1>
                <p className="character-subtitle">
                  {selectedSheet.characterClass && `${selectedSheet.characterClass} • `}
                  Level {selectedSheet.level}
                </p>
              </div>
              <button className="icon-button" onClick={startEdit}>
                <Edit size={20} />
              </button>
            </div>

            {rollResult && (
              <div className="roll-result">
                <Dices size={24} />
                <div className="roll-info">
                  <div className="roll-stat">{rollResult.stat.toUpperCase()}</div>
                  <div className="roll-calculation">
                    {rollResult.diceRoll} {rollResult.modifier >= 0 ? '+' : ''}{rollResult.modifier} = <strong>{rollResult.total}</strong>
                  </div>
                  {rollResult.sentToDiscord && (
                    <div className="roll-discord">✓ Sent to Discord</div>
                  )}
                </div>
              </div>
            )}

            <div className="stats-grid">
              {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map(stat => (
                <StatBlock 
                  key={stat}
                  stat={stat}
                  value={selectedSheet[stat]}
                  modifier={selectedSheet.modifiers[stat]}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <Dices size={64} />
            <h2>No Characters Yet</h2>
            <p>Create your first character to get started</p>
            <button 
              className="button primary"
              onClick={() => {
                resetForm();
                setIsCreating(true);
              }}
            >
              <Plus size={20} />
              Create Character
            </button>
          </div>
        )}
      </div>

      {/* PathCompanion Import Modal */}
      {showPathCompanionImport && (
        <div 
          className="pathcompanion-modal" 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPathCompanionImport(false);
            }
          }}
        >
          <div className="pathcompanion-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="pathcompanion-modal-header">
              <h3>Import from PathCompanion</h3>
              <button 
                className="icon-button"
                onClick={() => setShowPathCompanionImport(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="pathcompanion-share-form">
              <p>1. Go to <a href="https://pathcompanion.com" target="_blank" rel="noopener noreferrer">PathCompanion.com</a> and open your character</p>
              <p>2. Click "Share Character" and copy the share key</p>
              <p>3. Paste the share key below:</p>
              
              <div className="form-group">
                <label htmlFor="share-key">Share Key</label>
                <input
                  id="share-key"
                  type="text"
                  value={shareKey}
                  onChange={(e) => setShareKey(e.target.value)}
                  placeholder="Paste share key here"
                />
              </div>
              
              <button 
                className="button primary"
                onClick={importFromShareKey}
                disabled={!shareKey || importingPC}
              >
                {importingPC ? 'Importing...' : 'Import Character'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .character-sheets-container {
          display: flex;
          height: 100%;
          gap: 1rem;
        }

        .character-list {
          width: 280px;
          border-right: 1px solid var(--border-color);
          padding: 1rem;
          display: flex;
          flex-direction: column;
        }

        .character-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .character-list-header h2 {
          margin: 0;
          font-size: 1.25rem;
        }

        .character-items {
          flex: 1;
          overflow-y: auto;
        }

        .character-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .character-item:hover {
          background-color: var(--hover-bg);
        }

        .character-item.active {
          background-color: var(--primary-color);
          color: white;
        }

        .character-item-info {
          flex: 1;
        }

        .character-name {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .character-meta {
          font-size: 0.875rem;
          opacity: 0.8;
        }

        .character-sheet-view {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .character-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .character-header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
        }

        .character-subtitle {
          margin: 0;
          color: var(--text-secondary);
          font-size: 1.125rem;
        }

        .roll-result {
          background: linear-gradient(135deg, var(--primary-color), var(--primary-dark, #4a5568));
          color: white;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .roll-info {
          flex: 1;
        }

        .roll-stat {
          font-weight: 700;
          font-size: 0.875rem;
          opacity: 0.9;
          margin-bottom: 0.25rem;
        }

        .roll-calculation {
          font-size: 1.5rem;
        }

        .roll-discord {
          font-size: 0.875rem;
          margin-top: 0.5rem;
          opacity: 0.9;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .stat-block {
          background-color: var(--card-bg, #f7fafc);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1rem;
          text-align: center;
        }

        .stat-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .stat-modifier {
          font-size: 1.125rem;
          color: var(--primary-color);
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .roll-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .roll-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .roll-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .roll-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .character-form {
          max-width: 600px;
        }

        .character-form h2 {
          margin: 0 0 1.5rem 0;
        }

        .character-form h3 {
          margin: 1.5rem 0 1rem 0;
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
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1rem;
        }

        .stats-grid-form {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
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
        }

        .button.primary {
          background-color: var(--primary-color);
          color: white;
        }

        .button.secondary {
          background-color: var(--secondary-bg, #e2e8f0);
          color: var(--text-color);
        }

        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .icon-button {
          background: none;
          border: none;
          padding: 0.5rem;
          cursor: pointer;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .icon-button:hover {
          background-color: var(--hover-bg);
        }

        .icon-button.primary {
          background-color: var(--primary-color);
          color: white;
        }

        .icon-button.secondary {
          background-color: var(--card-bg, #f7fafc);
          color: var(--text-color);
        }

        .icon-button.secondary:hover {
          background-color: var(--hover-bg);
        }

        .icon-button.danger {
          color: #e53e3e;
        }

        .icon-button.danger:hover {
          background-color: #fff5f5;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-secondary);
          text-align: center;
        }

        .empty-state h2 {
          margin: 1rem 0 0.5rem 0;
        }

        .empty-state p {
          margin: 0 0 2rem 0;
        }

        /* PathCompanion Modal */
        .pathcompanion-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .pathcompanion-modal-content {
          background-color: #ffffff;
          border: 2px solid #4a5568;
          border-radius: 8px;
          padding: 2rem;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          color: #1a202c;
        }

        .pathcompanion-modal-content * {
          color: #1a202c;
        }

        .pathcompanion-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 1rem;
        }

        .pathcompanion-modal-header h3 {
          margin: 0;
          color: #1a202c;
          font-size: 1.5rem;
        }

        .pathcompanion-login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .pathcompanion-login-form label {
          color: #2d3748;
          font-weight: 600;
        }

        .pathcompanion-login-form input {
          background-color: #f7fafc;
          border: 2px solid #cbd5e0;
          color: #1a202c;
        }

        .pathcompanion-login-form input:focus {
          border-color: #4299e1;
          outline: none;
        }

        .pathcompanion-login-form .button.primary {
          background-color: #4299e1;
          color: white;
          font-weight: 600;
          padding: 0.75rem;
          border: none;
          cursor: pointer;
          border-radius: 6px;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .pathcompanion-login-form .button.primary:hover:not(:disabled) {
          background-color: #3182ce;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .pathcompanion-login-form .button.primary:disabled {
          background-color: #cbd5e0;
          cursor: not-allowed;
          color: #718096;
        }

        .pathcompanion-characters-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .pathcompanion-characters-list > p {
          color: #2d3748;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .pathcompanion-character-item {
          border: 2px solid #cbd5e0;
          border-radius: 6px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          background-color: #f7fafc;
        }

        .pathcompanion-character-item:hover {
          background-color: #edf2f7;
          border-color: #4299e1;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .pathcompanion-character-name {
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: #1a202c;
          font-size: 1.1rem;
        }

        .pathcompanion-character-details {
          font-size: 0.875rem;
          color: #4a5568;
        }

        .pathcompanion-badge {
          display: inline-flex;
          align-items: center;
          margin-left: 0.5rem;
          color: var(--primary-color);
        }

        .character-list-actions {
          display: flex;
          gap: 0.5rem;
        }

        .character-item-actions {
          display: flex;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
}
