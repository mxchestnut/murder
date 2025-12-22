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
  race?: string;
  alignment?: string;
  deity?: string;
  size?: string;
  currentHp?: number;
  maxHp?: number;
  tempHp?: number;
  armorClass?: number;
  touchAc?: number;
  flatFootedAc?: number;
  initiative?: number;
  speed?: number;
  baseAttackBonus?: number;
  cmb?: number;
  cmd?: number;
  fortitudeSave?: number;
  reflexSave?: number;
  willSave?: number;
  skills?: any;
  weapons?: any[];
  armor?: any;
  feats?: string[];
  specialAbilities?: string[];
  spells?: any;
  avatarUrl?: string;
  isPathCompanion?: boolean;
  pathCompanionId?: string;
  pathCompanionData?: string;
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
  const [characterId, setCharacterId] = useState('');
  const [importingPC, setImportingPC] = useState(false);
  const [pathCompanionCharacters, setPathCompanionCharacters] = useState<Array<{id: string, name: string, lastModified: string | null}>>([]);
  const [pathCompanionCampaigns, setPathCompanionCampaigns] = useState<Array<{id: string, name: string, lastModified: string | null}>>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [linkingCharacter, setLinkingCharacter] = useState<number | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [formData, setFormData] = useState<{
    name: string;
    characterClass: string;
    level: number;
    race: string;
    alignment: string;
    deity: string;
    size: string;
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    currentHp: number;
    maxHp: number;
    tempHp: number;
    armorClass: number;
    touchAc: number;
    flatFootedAc: number;
    initiative: number;
    speed: number;
    baseAttackBonus: number;
    cmb: number;
    cmd: number;
    fortitudeSave: number;
    reflexSave: number;
    willSave: number;
    skills: any;
    weapons: any[];
    armor: any;
    feats: string[];
    specialAbilities: string[];
    spells: any;
    avatarUrl: string;
  }>({
    name: '',
    characterClass: '',
    level: 1,
    race: '',
    alignment: '',
    deity: '',
    size: 'Medium',
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    currentHp: 0,
    maxHp: 0,
    tempHp: 0,
    armorClass: 10,
    touchAc: 10,
    flatFootedAc: 10,
    initiative: 0,
    speed: 30,
    baseAttackBonus: 0,
    cmb: 0,
    cmd: 10,
    fortitudeSave: 0,
    reflexSave: 0,
    willSave: 0,
    skills: {},
    weapons: [],
    armor: {},
    feats: [],
    specialAbilities: [],
    spells: {},
    avatarUrl: ''
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
      let avatarUrl = formData.avatarUrl;
      
      // Upload avatar if a file was selected
      if (avatarFile) {
        const formDataFile = new FormData();
        formDataFile.append('avatar', avatarFile);
        const uploadResponse = await api.post('/characters/upload-avatar', formDataFile, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        avatarUrl = uploadResponse.data.url;
      }
      
      const response = await api.post('/characters', { ...formData, avatarUrl });
      setSheets([...sheets, response.data]);
      setSelectedSheet(response.data);
      setIsCreating(false);
      resetForm();
      setAvatarFile(null);
      setAvatarPreview('');
    } catch (error) {
      console.error('Error creating character sheet:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedSheet) return;
    try {
      let avatarUrl = formData.avatarUrl;
      
      // Upload avatar if a file was selected
      if (avatarFile) {
        const formDataFile = new FormData();
        formDataFile.append('avatar', avatarFile);
        const uploadResponse = await api.post('/characters/upload-avatar', formDataFile, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        avatarUrl = uploadResponse.data.url;
      }
      
      const response = await api.put(`/characters/${selectedSheet.id}`, { ...formData, avatarUrl });
      const updatedSheets = sheets.map(s => s.id === selectedSheet.id ? response.data : s);
      setSheets(updatedSheets);
      setSelectedSheet(response.data);
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview('');
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

  const handleRoll = async (stat: string, rollType: string = 'ability', skillName?: string) => {
    if (!selectedSheet) return;
    try {
      const response = await api.post(`/characters/${selectedSheet.id}/roll`, { 
        stat, 
        rollType,
        skillName 
      });
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
      race: '',
      alignment: '',
      deity: '',
      size: 'Medium',
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      currentHp: 0,
      maxHp: 0,
      tempHp: 0,
      armorClass: 10,
      touchAc: 10,
      flatFootedAc: 10,
      initiative: 0,
      speed: 30,
      baseAttackBonus: 0,
      cmb: 0,
      cmd: 10,
      fortitudeSave: 0,
      reflexSave: 0,
      willSave: 0,
      skills: {},
      weapons: [],
      armor: {},
      feats: [],
      specialAbilities: [],
      spells: {},
      avatarUrl: ''
    });
  };

  const startEdit = () => {
    if (!selectedSheet) return;
    setFormData({
      name: selectedSheet.name,
      characterClass: selectedSheet.characterClass || '',
      level: selectedSheet.level,
      race: selectedSheet.race || '',
      alignment: selectedSheet.alignment || '',
      deity: selectedSheet.deity || '',
      size: selectedSheet.size || 'Medium',
      strength: selectedSheet.strength,
      dexterity: selectedSheet.dexterity,
      constitution: selectedSheet.constitution,
      intelligence: selectedSheet.intelligence,
      wisdom: selectedSheet.wisdom,
      charisma: selectedSheet.charisma,
      currentHp: selectedSheet.currentHp || 0,
      maxHp: selectedSheet.maxHp || 0,
      tempHp: selectedSheet.tempHp || 0,
      armorClass: selectedSheet.armorClass || 10,
      touchAc: selectedSheet.touchAc || 10,
      flatFootedAc: selectedSheet.flatFootedAc || 10,
      initiative: selectedSheet.initiative || 0,
      speed: selectedSheet.speed || 30,
      baseAttackBonus: selectedSheet.baseAttackBonus || 0,
      cmb: selectedSheet.cmb || 0,
      cmd: selectedSheet.cmd || 10,
      fortitudeSave: selectedSheet.fortitudeSave || 0,
      reflexSave: selectedSheet.reflexSave || 0,
      willSave: selectedSheet.willSave || 0,
      skills: selectedSheet.skills || {},
      weapons: selectedSheet.weapons || [],
      armor: selectedSheet.armor || {},
      feats: selectedSheet.feats || [],
      specialAbilities: selectedSheet.specialAbilities || [],
      spells: selectedSheet.spells || {},
      avatarUrl: selectedSheet.avatarUrl || ''
    });
    setIsEditing(true);
  };

  // PathCompanion integration handlers
  const loadPathCompanionCharacters = async () => {
    setLoadingCharacters(true);
    setPathCompanionCharacters([]);
    setPathCompanionCampaigns([]);
    
    try {
      const response = await api.get('/pathcompanion/characters');
      setPathCompanionCharacters(response.data.characters || []);
      setPathCompanionCampaigns(response.data.campaigns || []);
      
      // If no characters or campaigns found, show a message
      if ((response.data.characters || []).length === 0 && (response.data.campaigns || []).length === 0) {
        console.log('No characters or campaigns found in PathCompanion account');
      }
    } catch (error: any) {
      console.error('Failed to load PathCompanion characters:', error);
      
      // Don't show alert during loading, we'll show the error in the modal
      setPathCompanionCharacters([]);
      setPathCompanionCampaigns([]);
    } finally {
      setLoadingCharacters(false);
    }
  };

  const importPathCompanionCharacter = async (charId?: string) => {
    const idToImport = charId || characterId;
    if (!idToImport) return;

    setImportingPC(true);
    try {
      const response = await api.post('/pathcompanion/import', {
        characterId: idToImport
      });
      
      // Reload all sheets to get the imported character
      await loadSheets();
      setSelectedSheet(response.data);
      setShowPathCompanionImport(false);
      setCharacterId('');
      setPathCompanionCharacters([]);
      setPathCompanionCampaigns([]);
      alert(`Successfully imported ${response.data.name}!`);
    } catch (error: any) {
      console.error('Failed to import PathCompanion character:', error);
      const errorMsg = error.response?.data?.error || 'Failed to import character.';
      alert(`Import failed: ${errorMsg}`);
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

  const importAllCharacters = async () => {
    if (pathCompanionCharacters.length === 0) {
      alert('No characters to import');
      return;
    }

    if (!confirm(`This will import all ${pathCompanionCharacters.length} characters from PathCompanion. Continue?`)) {
      return;
    }

    setImportingPC(true);
    try {
      const response = await api.post('/pathcompanion/import-all');
      
      // Reload all sheets to show the imported characters
      await loadSheets();
      
      setShowPathCompanionImport(false);
      setPathCompanionCharacters([]);
      setPathCompanionCampaigns([]);
      
      const { success, failed } = response.data;
      const successCount = success.length;
      const failedCount = failed.length;
      
      let message = `Successfully imported ${successCount} character${successCount !== 1 ? 's' : ''}`;
      if (failedCount > 0) {
        message += `\n${failedCount} character${failedCount !== 1 ? 's' : ''} failed to import`;
      }
      
      alert(message);
    } catch (error: any) {
      console.error('Failed to import all characters:', error);
      const errorMsg = error.response?.data?.error || 'Failed to import characters.';
      alert(`Import all failed: ${errorMsg}`);
    } finally {
      setImportingPC(false);
    }
  };

  const linkToPathCompanion = async (sheetId: number, pathCompanionCharacterId: string) => {
    try {
      const response = await api.post(`/characters/${sheetId}/link-pathcompanion`, {
        pathCompanionCharacterId
      });
      
      const updatedSheets = sheets.map(s => s.id === sheetId ? response.data : s);
      setSheets(updatedSheets);
      if (selectedSheet?.id === sheetId) {
        setSelectedSheet(response.data);
      }
      
      setLinkingCharacter(null);
      setPathCompanionCharacters([]);
      setPathCompanionCampaigns([]);
      
      alert('Character successfully linked to PathCompanion!');
    } catch (error: any) {
      console.error('Failed to link character to PathCompanion:', error);
      const errorMsg = error.response?.data?.error || 'Failed to link character.';
      alert(`Link failed: ${errorMsg}`);
    }
  };

  const StatBlock = ({ stat, value, modifier }: { stat: string; value: number; modifier: number }) => {
    const Icon = statIcons[stat as keyof typeof statIcons];
    const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
    
    return (
      <div 
        className="stat-block clickable"
        onClick={() => handleRoll(stat, 'ability')}
        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <div className="stat-header">
          <Icon size={18} />
          <span>{stat.toUpperCase()}</span>
        </div>
        <div className="stat-value">{value}</div>
        <div className="stat-modifier">{modifierStr}</div>
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
              onClick={() => {
                setShowPathCompanionImport(true);
                loadPathCompanionCharacters();
              }}
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

            <h3>Discord Avatar</h3>
            <div className="form-group">
              <label>Avatar Image (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setAvatarFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setAvatarPreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {(avatarPreview || formData.avatarUrl) && (
                <div style={{ marginTop: '1rem' }}>
                  <img 
                    src={avatarPreview || formData.avatarUrl} 
                    alt="Avatar preview" 
                    style={{ 
                      width: '100px', 
                      height: '100px', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      border: '2px solid var(--border-color)'
                    }} 
                  />
                </div>
              )}
              <small>Upload an image for character avatar when using Discord proxying. Leave empty for auto-generated avatar.</small>
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
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!selectedSheet.isPathCompanion && (
                  <button 
                    className="icon-button secondary" 
                    onClick={() => {
                      setLinkingCharacter(selectedSheet.id);
                      loadPathCompanionCharacters();
                    }}
                    title="Link to PathCompanion"
                  >
                    <ExternalLink size={20} />
                  </button>
                )}
                <button className="icon-button" onClick={startEdit}>
                  <Edit size={20} />
                </button>
              </div>
            </div>

            {rollResult && (
              <div className="roll-result">
                <Dices size={24} />
                <div className="roll-info">
                  <div className="roll-stat">{rollResult.rollDescription || rollResult.stat?.toUpperCase()}</div>
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

            {/* Combat Stats */}
            <div className="sheet-section">
              <h3>Combat</h3>
              <div className="combat-grid">
                <div className="stat-box">
                  <div className="stat-label">HP</div>
                  <div className="stat-value-large">
                    {selectedSheet.currentHp || 0}/{selectedSheet.maxHp || 0}
                  </div>
                  {(selectedSheet.tempHp || 0) > 0 && (
                    <div className="stat-temp">+{selectedSheet.tempHp} temp</div>
                  )}
                </div>
                <div className="stat-box">
                  <div className="stat-label">AC</div>
                  <div className="stat-value-large">{selectedSheet.armorClass || 10}</div>
                  <div className="stat-detail">
                    Touch: {selectedSheet.touchAc || 10} / FF: {selectedSheet.flatFootedAc || 10}
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Initiative</div>
                  <div className="stat-value-large">
                    {(selectedSheet.initiative || 0) >= 0 ? '+' : ''}{selectedSheet.initiative || 0}
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Speed</div>
                  <div className="stat-value-large">{selectedSheet.speed || 30} ft</div>
                </div>
              </div>
            </div>

            {/* Saves */}
            <div className="sheet-section">
              <h3>Saving Throws</h3>
              <div className="saves-grid">
                <div 
                  className="save-box clickable"
                  onClick={() => handleRoll('fortitude', 'save')}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div className="save-label">Fortitude</div>
                  <div className="save-value">
                    {(selectedSheet.fortitudeSave || 0) >= 0 ? '+' : ''}{selectedSheet.fortitudeSave || 0}
                  </div>
                </div>
                <div 
                  className="save-box clickable"
                  onClick={() => handleRoll('reflex', 'save')}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div className="save-label">Reflex</div>
                  <div className="save-value">
                    {(selectedSheet.reflexSave || 0) >= 0 ? '+' : ''}{selectedSheet.reflexSave || 0}
                  </div>
                </div>
                <div 
                  className="save-box clickable"
                  onClick={() => handleRoll('will', 'save')}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div className="save-label">Will</div>
                  <div className="save-value">
                    {(selectedSheet.willSave || 0) >= 0 ? '+' : ''}{selectedSheet.willSave || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Defensive Abilities */}
            {selectedSheet.pathCompanionData && (() => {
              try {
                const pcData = JSON.parse(selectedSheet.pathCompanionData);
                const defense = pcData.defense || {};
                
                const hasDR = defense.dr && Object.keys(defense.dr).length > 0;
                // SR can be: number, object with .total, or object with .bonuses array
                const hasSR = defense.sr && (
                  (typeof defense.sr === 'number' && defense.sr > 0) ||
                  (typeof defense.sr === 'object' && (defense.sr.total > 0 || (defense.sr.bonuses && defense.sr.bonuses.length > 0)))
                );
                const hasResistances = defense.resistances && Object.keys(defense.resistances).length > 0;
                const hasImmunities = defense.immunities && defense.immunities.length > 0;
                
                if (hasDR || hasSR || hasResistances || hasImmunities) {
                  return (
                    <div className="sheet-section">
                      <h3>Defensive Abilities</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {hasSR && (
                          <div className="stat-inline">
                            <span className="label">SR:</span>
                            <span className="value">
                              {typeof defense.sr === 'number' 
                                ? defense.sr 
                                : defense.sr.total || (defense.sr.bonuses && defense.sr.bonuses.length > 0 
                                  ? `${11 + selectedSheet.level}` 
                                  : 'Yes')}
                            </span>
                          </div>
                        )}
                        {hasDR && (
                          <div style={{ flex: '1 1 100%' }}>
                            <strong>Damage Reduction:</strong>
                            <div style={{ marginTop: '0.5rem' }}>
                              {Object.entries(defense.dr).map(([type, value]: [string, any]) => {
                                const drValue = typeof value === 'object' ? (value.total || 0) : value;
                                return (
                                  <div key={type} style={{ marginLeft: '1rem' }}>
                                    {drValue}/{type}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {hasResistances && (
                          <div style={{ flex: '1 1 100%' }}>
                            <strong>Resistances:</strong>
                            <div style={{ marginTop: '0.5rem' }}>
                              {Object.entries(defense.resistances).map(([type, value]: [string, any]) => {
                                const resValue = typeof value === 'object' ? (value.total || 0) : value;
                                return (
                                  <div key={type} style={{ marginLeft: '1rem' }}>
                                    {type} {resValue}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {hasImmunities && (
                          <div style={{ flex: '1 1 100%' }}>
                            <strong>Immunities:</strong>
                            <div style={{ marginTop: '0.5rem', marginLeft: '1rem' }}>
                              {defense.immunities.join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              } catch (e) {
                return null;
              }
              return null;
            })()}

            {/* Offense */}
            <div className="sheet-section">
              <h3>Offense</h3>
              <div className="offense-grid">
                <div className="stat-inline">
                  <span className="label">BAB:</span>
                  <span className="value">
                    {(selectedSheet.baseAttackBonus || 0) >= 0 ? '+' : ''}{selectedSheet.baseAttackBonus || 0}
                  </span>
                </div>
                <div className="stat-inline">
                  <span className="label">CMB:</span>
                  <span className="value">
                    {(selectedSheet.cmb || 0) >= 0 ? '+' : ''}{selectedSheet.cmb || 0}
                  </span>
                </div>
                <div className="stat-inline">
                  <span className="label">CMD:</span>
                  <span className="value">{selectedSheet.cmd || 10}</span>
                </div>
              </div>
              {selectedSheet.weapons && selectedSheet.weapons.length > 0 && (
                <div className="weapons-list">
                  <h4>Weapons</h4>
                  {selectedSheet.weapons.map((weapon: any, idx: number) => (
                    <div key={idx} className="weapon-item">
                      <span className="weapon-name">{weapon.name}</span>
                      <span className="weapon-stats">
                        {weapon.attackBonus && `+${weapon.attackBonus} `}
                        {weapon.damage && `(${weapon.damage})`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Feats & Abilities */}
            {((selectedSheet.feats && selectedSheet.feats.length > 0) || 
              (selectedSheet.specialAbilities && selectedSheet.specialAbilities.length > 0)) && (
              <div className="sheet-section">
                <h3>Feats & Special Abilities</h3>
                {selectedSheet.feats && selectedSheet.feats.length > 0 && (
                  <div className="feats-list">
                    <h4>Feats</h4>
                    <div className="feat-tags">
                      {selectedSheet.feats.map((feat: string, idx: number) => (
                        <span key={idx} className="feat-tag">{feat}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedSheet.specialAbilities && selectedSheet.specialAbilities.length > 0 && (
                  <div className="abilities-list">
                    <h4>Special Abilities</h4>
                    {selectedSheet.specialAbilities.map((ability: string, idx: number) => (
                      <div key={idx} className="ability-item">{ability}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Skills */}
            {selectedSheet.skills && Object.keys(selectedSheet.skills).length > 0 && (
              <div className="sheet-section">
                <h3>Skills</h3>
                <div className="skills-grid">
                  {Object.entries(selectedSheet.skills).map(([skillName, skillData]: [string, any]) => (
                    <div 
                      key={skillName} 
                      className="skill-item clickable"
                      onClick={() => handleRoll('', 'skill', skillName)}
                      style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <span className="skill-name">{skillName}</span>
                      <span className="skill-value">
                        {skillData.total >= 0 ? '+' : ''}{skillData.total || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              <h3>{linkingCharacter ? 'Link to PathCompanion' : 'Import from PathCompanion'}</h3>
              <button 
                className="icon-button"
                onClick={() => {
                  setShowPathCompanionImport(false);
                  setCharacterId('');
                  setLinkingCharacter(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="pathcompanion-import-form">
              {loadingCharacters ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>Loading your PathCompanion data...</p>
                </div>
              ) : (pathCompanionCharacters.length > 0 || pathCompanionCampaigns.length > 0) ? (
                <>
                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                      Click a character or campaign to import it:
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="button primary"
                        onClick={importAllCharacters}
                        disabled={loadingCharacters || importingPC || pathCompanionCharacters.length === 0}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      >
                        Import All Characters
                      </button>
                      <button 
                        className="button secondary"
                        onClick={loadPathCompanionCharacters}
                        disabled={loadingCharacters}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      >
                        Refresh List
                      </button>
                    </div>
                  </div>
                  
                  {pathCompanionCharacters.length > 0 && (
                    <>
                      <h4>Characters</h4>
                      <div className="pathcompanion-characters-list">
                        {pathCompanionCharacters.map(char => (
                          <div
                            key={char.id}
                            className="pathcompanion-character-item"
                            onClick={() => !importingPC && (linkingCharacter ? linkToPathCompanion(linkingCharacter, char.id) : importPathCompanionCharacter(char.id))}
                            style={{ cursor: importingPC ? 'not-allowed' : 'pointer', opacity: importingPC ? 0.5 : 1 }}
                          >
                            <div className="pathcompanion-character-name">{char.name}</div>
                            <div className="pathcompanion-character-details">
                              {char.id}{char.lastModified && ` • Last modified: ${new Date(char.lastModified).toLocaleDateString()}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {pathCompanionCampaigns.length > 0 && (
                    <>
                      <h4 style={{ marginTop: pathCompanionCharacters.length > 0 ? '1.5rem' : 0 }}>Campaigns (GM Mode)</h4>
                      <div className="pathcompanion-characters-list">
                        {pathCompanionCampaigns.map(campaign => (
                          <div
                            key={campaign.id}
                            className="pathcompanion-character-item"
                            onClick={() => !importingPC && importPathCompanionCharacter(campaign.id)}
                            style={{ cursor: importingPC ? 'not-allowed' : 'pointer', opacity: importingPC ? 0.5 : 1 }}
                          >
                            <div className="pathcompanion-character-name">{campaign.name}</div>
                            <div className="pathcompanion-character-details">
                              {campaign.id}{campaign.lastModified && ` • Last modified: ${new Date(campaign.lastModified).toLocaleDateString()}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p style={{ marginBottom: '1rem', color: '#888' }}>
                    {loadingCharacters ? 'Loading...' : 'No characters or campaigns found.'}
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
                    Make sure you've connected your PathCompanion account in Settings.
                  </p>
                  <button 
                    className="button secondary"
                    onClick={loadPathCompanionCharacters}
                    disabled={loadingCharacters}
                    style={{ marginBottom: '1.5rem' }}
                  >
                    {loadingCharacters ? 'Loading...' : 'Try Loading Again'}
                  </button>
                  
                  <hr style={{ margin: '1.5rem 0', borderColor: '#ddd' }} />
                  
                  <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Or enter a character ID manually:</p>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
                    Examples: character1, character2, gm1, gm2, etc.
                  </p>
                  <div className="form-group">
                    <label htmlFor="character-id">Character ID</label>
                    <input
                      id="character-id"
                      type="text"
                      value={characterId}
                      onChange={(e) => setCharacterId(e.target.value)}
                      placeholder="e.g., character4"
                    />
                  </div>
                  <button 
                    className="button primary"
                    onClick={() => importPathCompanionCharacter()}
                    disabled={!characterId || importingPC}
                  >
                    {importingPC ? 'Importing...' : 'Import Character'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .character-sheets-container {
          display: flex;
          height: 100%;
          gap: 0;
        }

        .character-list {
          flex: 0 0 auto;
          width: 280px;
          min-width: 200px;
          max-width: 600px;
          resize: horizontal;
          overflow: hidden;
          border-right: 2px solid var(--border-color);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          background: var(--bg-color, white);
        }

        .character-sheet-view {
          flex: 0 0 auto;
          width: 800px;
          min-width: 400px;
          max-width: 1400px;
          resize: horizontal;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 2rem;
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
          color: var(--text-color, #1a202c);
        }

        .character-item:hover {
          background-color: var(--hover-bg, #f7fafc);
        }

        .character-item.active {
          background-color: var(--primary-color, #4299e1);
          color: white;
        }

        .character-item-info {
          flex: 1;
        }

        .character-name {
          font-weight: 600;
          margin-bottom: 0.25rem;
          color: inherit;
        }

        .character-meta {
          font-size: 0.875rem;
          opacity: 0.8;
          color: inherit;
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

        .icon-button.primary:hover {
          background-color: #4c51bf;
          transform: scale(1.05);
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
import-form .button.primary,
        .pathcompanion-share-form .button.primary,
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

        .pathcompanion-import-form .button.primary:hover:not(:disabled),
        .pathcompanion-share-form .button.primary:hover:not(:disabled),
        .pathcompanion-login-form .button.primary:hover:not(:disabled) {
          background-color: #3182ce;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .pathcompanion-import-form .button.primary:disabled,
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

        .pathcompanion-share-form .button.primary,
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

        .pathcompanion-share-form .button.primary:hover:not(:disabled),
        .pathcompanion-login-form .button.primary:hover:not(:disabled) {
          background-color: #3182ce;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .pathcompanion-share-form .button.primary:disabled,
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

        /* Expanded Character Sheet Sections */
        .sheet-section {
          margin: 2rem 0;
          padding: 1.5rem;
          background: var(--card-bg, #f7fafc);
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .sheet-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
          color: var(--text-color);
          border-bottom: 2px solid var(--border-color);
          padding-bottom: 0.5rem;
        }

        .sheet-section h4 {
          margin: 1rem 0 0.5rem 0;
          font-size: 1rem;
          color: var(--text-color);
        }

        .combat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .stat-box {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          text-align: center;
          border: 2px solid var(--border-color);
        }

        .stat-label {
          font-size: 0.875rem;
          text-transform: uppercase;
          color: #718096;
          margin-bottom: 0.5rem;
        }

        .stat-value-large {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--primary-color);
        }

        .stat-detail, .stat-temp {
          font-size: 0.875rem;
          color: #718096;
          margin-top: 0.25rem;
        }

        .saves-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .save-box {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          text-align: center;
          border: 2px solid var(--border-color);
        }

        .save-label {
          font-size: 0.875rem;
          text-transform: uppercase;
          color: #718096;
          margin-bottom: 0.5rem;
        }

        .save-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary-color);
        }

        .offense-grid {
          display: flex;
          gap: 2rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .stat-inline {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .stat-inline .label {
          font-weight: 600;
          color: #4a5568;
        }

        .stat-inline .value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--primary-color);
        }

        .weapons-list {
          margin-top: 1rem;
        }

        .weapon-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: white;
          border-radius: 6px;
          margin-bottom: 0.5rem;
          border: 1px solid var(--border-color);
        }

        .weapon-name {
          font-weight: 600;
          color: var(--text-color);
        }

        .weapon-stats {
          color: #718096;
          font-family: monospace;
        }

        .feats-list, .abilities-list {
          margin-top: 1rem;
        }

        .feat-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .feat-tag {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-color);
        }

        .ability-item {
          padding: 0.75rem;
          background: white;
          border-radius: 6px;
          margin-bottom: 0.5rem;
          border-left: 3px solid var(--primary-color);
        }

        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.5rem;
        }

        .skill-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: white;
          border-radius: 4px;
          border: 1px solid var(--border-color);
        }

        .skill-name {
          font-size: 0.875rem;
          color: var(--text-color);
        }

        .skill-value {
          font-weight: 700;
          color: var(--primary-color);
          font-family: monospace;
        }
      `}</style>
    </div>
  );
}
