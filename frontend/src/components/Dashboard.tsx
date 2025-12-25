import { useState, useEffect } from 'react';
import HamburgerSidebar from './HamburgerSidebar';
import Editor from './Editor';
import Settings from './Settings';
import DiscordCommands from './DiscordCommands';
import CharacterBio from './CharacterBio';
import CharacterMemories from './CharacterMemories';
import FileManager from './FileManager';
import KnowledgeBase from './KnowledgeBase';
import PromptsTropes from './PromptsTropes';
import StatsDashboard from './StatsDashboard';
import HallOfFameGallery from './HallOfFameGallery';
import AdminPanel from './AdminPanel';
import PasswordRotationBanner from './PasswordRotationBanner';
import { api } from '../utils/api';
import { FileText, X, Dices } from 'lucide-react';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const [currentCharacter, setCurrentCharacter] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showDiscordCommands, setShowDiscordCommands] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [showPromptsTropes, setShowPromptsTropes] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHallOfFame, setShowHallOfFame] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [characterTab, setCharacterTab] = useState<'bio' | 'memories'>('bio');
  const [characterPanelCollapsed, setCharacterPanelCollapsed] = useState(false);
  const [rollResult, setRollResult] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const handleRoll = async (stat: string, rollType: string = 'ability', skillName?: string) => {
    if (!currentCharacter) return;
    try {
      const response = await api.post(`/characters/${currentCharacter.id}/roll`, {
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

  const handleSelectDocument = (doc: any) => {
    setCurrentDocument(doc);
    setShowSettings(false);
    setShowDiscordCommands(false);
    setShowFileManager(false);
    setShowKnowledgeBase(false);
    setShowPromptsTropes(false);
    setShowStats(false);
    setShowHallOfFame(false);
    setShowAdminPanel(false);
  };

  const handleSelectCharacter = (character: any) => {
    setCurrentCharacter(character);
    setCurrentDocument(null);
    setShowSettings(false);
    setShowDiscordCommands(false);
    setShowFileManager(false);
    setShowPromptsTropes(false);
    setShowStats(false);
    setShowHallOfFame(false);
    setShowKnowledgeBase(false);
    setCharacterPanelCollapsed(false);
  };

  const reloadCurrentCharacter = async () => {
    if (!currentCharacter) return;
    try {
      const response = await api.get(`/characters/${currentCharacter.id}`);
      setCurrentCharacter(response.data);
    } catch (error) {
      console.error('Error reloading character:', error);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const loadDocuments = async (parentId?: number) => {
    try {
      const response = await api.get('/documents', { params: { parentId } });
      setDocuments(response.data);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Hamburger Sidebar */}
      <HamburgerSidebar
        documents={documents}
        onSelectDocument={handleSelectDocument}
        onSelectCharacter={handleSelectCharacter}
        onRefresh={loadDocuments}
        currentDocument={currentDocument}
        currentCharacter={currentCharacter}
        user={user}
        onShowAdminPanel={() => {
          setShowAdminPanel(!showAdminPanel);
          setShowSettings(false);
          setShowDiscordCommands(false);
          setShowFileManager(false);
          setShowPromptsTropes(false);
          setShowKnowledgeBase(false);
          setCurrentDocument(null);
          setCurrentCharacter(null);
        }}
        onShowFileManager={() => {
          setShowFileManager(true);
          setShowSettings(false);
          setShowDiscordCommands(false);
          setShowPromptsTropes(false);
          setShowStats(false);
          setShowHallOfFame(false);
          setShowKnowledgeBase(false);
          setShowAdminPanel(false);
          setCurrentDocument(null);
          setCurrentCharacter(null);
        }}
        onShowKnowledgeBase={() => {
          setShowKnowledgeBase(true);
          setShowSettings(false);
          setShowDiscordCommands(false);
          setShowPromptsTropes(false);
          setShowStats(false);
          setShowHallOfFame(false);
          setShowFileManager(false);
          setShowAdminPanel(false);
          setCurrentDocument(null);
          setCurrentCharacter(null);
        }}
        onShowStats={() => {
          setShowStats(true);
          setShowSettings(false);
          setShowDiscordCommands(false);
          setShowPromptsTropes(false);
          setShowKnowledgeBase(false);
          setShowHallOfFame(false);
          setShowFileManager(false);
          setShowAdminPanel(false);
          setCurrentDocument(null);
          setCurrentCharacter(null);
        }}
        onShowSettings={() => {
          setShowSettings(true);
          setShowDiscordCommands(false);
          setShowPromptsTropes(false);
          setShowStats(false);
          setShowHallOfFame(false);
          setShowKnowledgeBase(false);
          setShowFileManager(false);
          setShowAdminPanel(false);
          setCurrentDocument(null);
          setCurrentCharacter(null);
        }}
        onShowDiscordCommands={() => {
          setShowDiscordCommands(true);
          setShowSettings(false);
          setShowPromptsTropes(false);
          setShowStats(false);
          setShowHallOfFame(false);
          setShowKnowledgeBase(false);
          setShowFileManager(false);
          setShowAdminPanel(false);
          setCurrentDocument(null);
          setCurrentCharacter(null);
        }}
        onShowPromptsTropes={() => {
          setShowPromptsTropes(true);
          setShowSettings(false);
          setShowDiscordCommands(false);
          setShowStats(false);
          setShowHallOfFame(false);
          setShowKnowledgeBase(false);
          setShowFileManager(false);
          setShowAdminPanel(false);
          setCurrentDocument(null);
          setCurrentCharacter(null);
        }}
        onShowHallOfFame={() => {
          setShowHallOfFame(true);
          setShowSettings(false);
          setShowDiscordCommands(false);
          setShowPromptsTropes(false);
          setShowStats(false);
          setShowKnowledgeBase(false);
          setShowFileManager(false);
          setShowAdminPanel(false);
          setCurrentDocument(null);
          setCurrentCharacter(null);
        }}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '300px' }}>
        {/* Password Rotation Banner */}
        <PasswordRotationBanner />

        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {showSettings ? (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <Settings />
            </div>
          ) : showDiscordCommands ? (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <DiscordCommands />
            </div>
          ) : showFileManager ? (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <FileManager />
            </div>
          ) : showKnowledgeBase ? (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <KnowledgeBase />
            </div>
          ) : showPromptsTropes ? (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <PromptsTropes />
            </div>
          ) : showStats ? (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <StatsDashboard />
            </div>
          ) : showHallOfFame ? (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <HallOfFameGallery />
            </div>
          ) : showAdminPanel ? (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <AdminPanel />
            </div>
          ) : (
            <>
              {currentCharacter && (
                <div style={{
                  flex: characterPanelCollapsed ? '0 0 auto' : '1',
                  width: characterPanelCollapsed ? 'auto' : 'auto',
                  minWidth: characterPanelCollapsed ? 'auto' : 0,
                  maxWidth: characterPanelCollapsed ? 'none' : 'none',
                  resize: characterPanelCollapsed ? 'none' : 'none',
                  overflow: 'auto',
                  padding: characterPanelCollapsed ? '0.5rem 1rem' : '2rem',
                  borderRight: currentDocument ? '1px solid var(--border-color)' : 'none',
                  background: characterPanelCollapsed ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                  borderBottom: characterPanelCollapsed ? `1px solid var(--border-color)` : 'none'
                }}>
                  {characterPanelCollapsed ? (
                    <div
                      onClick={() => setCharacterPanelCollapsed(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        cursor: 'pointer',
                        padding: '0.5rem'
                      }}
                      title="Click to expand"
                    >
                      <Dices size={20} style={{ color: 'var(--text-primary)' }} />
                      <div>
                        <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {currentCharacter.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {currentCharacter.characterClass} • Level {currentCharacter.level} • Click to expand
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="character-display" style={{ fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <div>
                          <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem' }}>{currentCharacter.name}</h1>
                          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                            {currentCharacter.characterClass && `${currentCharacter.characterClass} • `}
                            Level {currentCharacter.level}
                          </p>
                        </div>
                        <button
                          onClick={() => setCharacterPanelCollapsed(true)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: 'none',
                            background: 'var(--accent-1)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                          }}
                          title="Collapse character panel"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Character Tabs */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)' }}>
                        <button
                          onClick={() => setCharacterTab('bio')}
                          style={{
                            padding: '0.75rem 1.25rem',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: characterTab === 'bio' ? '2px solid var(--primary-color)' : '2px solid transparent',
                            color: characterTab === 'bio' ? 'var(--primary-color)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: characterTab === 'bio' ? '600' : '400',
                            marginBottom: '-2px'
                          }}
                        >
                          Bio
                        </button>
                        <button
                          onClick={() => setCharacterTab('memories')}
                          style={{
                            padding: '0.75rem 1.25rem',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: characterTab === 'memories' ? '2px solid var(--primary-color)' : '2px solid transparent',
                            color: characterTab === 'memories' ? 'var(--primary-color)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: characterTab === 'memories' ? '600' : '400',
                            marginBottom: '-2px'
                          }}
                        >
                          💭 Memories
                        </button>
                      </div>

                      {/* Character Content Based on Tab */}
                      {characterTab === 'bio' ? (
                        <CharacterBio character={currentCharacter} onUpdate={reloadCurrentCharacter} />
                      ) : (
                        <CharacterMemories
                          characterId={currentCharacter.id}
                          characterName={currentCharacter.name}
                          guildId={currentCharacter.guildId}
                        />
                      )}

                      {/* Roll Result */}
                      {rollResult && (
                        <div style={{
                          padding: '1rem',
                          marginBottom: '1.5rem',
                          background: 'var(--accent-2)',
                          borderRadius: '8px',
                          border: '2px solid var(--accent-1)',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            {rollResult.rollDescription}
                          </div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            {rollResult.diceRoll} {rollResult.modifier >= 0 ? '+' : ''}{rollResult.modifier} = <span style={{ color: 'var(--accent-1)' }}>{rollResult.total}</span>
                          </div>
                          {rollResult.sentToDiscord && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                              ✓ Sent to Discord
                            </div>
                          )}
                        </div>
                      )}

                      {/* Ability Scores */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '0.75rem',
                        marginBottom: '1.5rem'
                      }}>
                        {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map(stat => (
                          <div
                            key={stat}
                            onClick={() => handleRoll(stat, 'ability')}
                            style={{
                              padding: '0.75rem',
                              borderRadius: '8px',
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-color)',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--accent-2)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'var(--bg-secondary)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                            title="Click to roll"
                          >
                            <div style={{
                              fontSize: '0.65rem',
                              textTransform: 'uppercase',
                              color: 'var(--text-secondary)',
                              marginBottom: '0.25rem'
                            }}>
                              {stat.substring(0, 3)}
                            </div>
                            <div style={{
                              fontSize: '1.5rem',
                              fontWeight: 'bold',
                              color: 'var(--text-primary)'
                            }}>
                              {currentCharacter[stat]}
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              marginTop: '0.15rem'
                            }}>
                              {currentCharacter.modifiers?.[stat] >= 0 ? '+' : ''}{currentCharacter.modifiers?.[stat] || 0}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Combat Stats */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Combat</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>HP</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                              {currentCharacter.currentHp || 0}/{currentCharacter.maxHp || 0}
                            </div>
                            {(currentCharacter.tempHp || 0) > 0 && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--accent-1)', marginTop: '0.15rem' }}>+{currentCharacter.tempHp} temp</div>
                            )}
                          </div>
                          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>AC</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                              {currentCharacter.armorClass || 10}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                              Touch: {currentCharacter.touchAc || 10} / FF: {currentCharacter.flatFootedAc || 10}
                            </div>
                          </div>
                          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Initiative</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                              {(currentCharacter.initiative || 0) >= 0 ? '+' : ''}{currentCharacter.initiative || 0}
                            </div>
                          </div>
                          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Speed</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                              {currentCharacter.speed || 30} ft
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Saving Throws */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Saving Throws</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                          <div
                            onClick={() => handleRoll('fortitude', 'save')}
                            style={{
                              padding: '0.75rem',
                              background: 'var(--bg-secondary)',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--accent-2)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'var(--bg-secondary)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                            title="Click to roll"
                          >
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Fort</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                              {(currentCharacter.fortitudeSave || 0) >= 0 ? '+' : ''}{currentCharacter.fortitudeSave || 0}
                            </div>
                          </div>
                          <div
                            onClick={() => handleRoll('reflex', 'save')}
                            style={{
                              padding: '0.75rem',
                              background: 'var(--bg-secondary)',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--accent-2)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'var(--bg-secondary)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                            title="Click to roll"
                          >
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Ref</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                              {(currentCharacter.reflexSave || 0) >= 0 ? '+' : ''}{currentCharacter.reflexSave || 0}
                            </div>
                          </div>
                          <div
                            onClick={() => handleRoll('will', 'save')}
                            style={{
                              padding: '0.75rem',
                              background: 'var(--bg-secondary)',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--accent-2)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'var(--bg-secondary)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                            title="Click to roll"
                          >
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Will</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                              {(currentCharacter.willSave || 0) >= 0 ? '+' : ''}{currentCharacter.willSave || 0}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Defensive Abilities */}
                      {currentCharacter.pathCompanionData && (() => {
                        try {
                          const pcData = JSON.parse(currentCharacter.pathCompanionData);
                          const defense = pcData.defense || {};

                          const hasDR = defense.dr && Object.keys(defense.dr).length > 0;
                          const hasSR = defense.sr && (
                            (typeof defense.sr === 'number' && defense.sr > 0) ||
                            (typeof defense.sr === 'object' && (defense.sr.total > 0 || (defense.sr.bonuses && defense.sr.bonuses.length > 0)))
                          );
                          const hasResistances = defense.resistances && Object.keys(defense.resistances).length > 0;
                          const hasImmunities = defense.immunities && defense.immunities.length > 0;

                          if (hasDR || hasSR || hasResistances || hasImmunities) {
                            return (
                              <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Defensive Abilities</h3>
                                <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                  {hasSR && (
                                    <div style={{ marginBottom: '0.5rem' }}>
                                      <strong style={{ color: 'var(--text-primary)' }}>SR:</strong>{' '}
                                      <span style={{ color: 'var(--text-secondary)' }}>
                                        {typeof defense.sr === 'number'
                                          ? defense.sr
                                          : defense.sr.total || (defense.sr.bonuses && defense.sr.bonuses.length > 0
                                            ? `${11 + currentCharacter.level}`
                                            : 'Yes')}
                                      </span>
                                    </div>
                                  )}
                                  {hasDR && (
                                    <div style={{ marginBottom: '0.5rem' }}>
                                      <strong style={{ color: 'var(--text-primary)' }}>DR:</strong>
                                      {Object.entries(defense.dr).map(([type, value]: [string, any]) => {
                                        const drValue = typeof value === 'object' ? (value.total || 0) : value;
                                        return (
                                          <div key={type} style={{ marginLeft: '1rem', color: 'var(--text-secondary)' }}>
                                            {drValue}/{type}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {hasResistances && (
                                    <div style={{ marginBottom: '0.5rem' }}>
                                      <strong style={{ color: 'var(--text-primary)' }}>Resistances:</strong>
                                      {Object.entries(defense.resistances).map(([type, value]: [string, any]) => {
                                        const resValue = typeof value === 'object' ? (value.total || 0) : value;
                                        return (
                                          <div key={type} style={{ marginLeft: '1rem', color: 'var(--text-secondary)' }}>
                                            {type} {resValue}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {hasImmunities && (
                                    <div>
                                      <strong style={{ color: 'var(--text-primary)' }}>Immunities:</strong>{' '}
                                      <span style={{ color: 'var(--text-secondary)' }}>{defense.immunities.join(', ')}</span>
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
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Offense</h3>
                        <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            <div>
                              <strong style={{ color: 'var(--text-primary)' }}>BAB:</strong>{' '}
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {(currentCharacter.baseAttackBonus || 0) >= 0 ? '+' : ''}{currentCharacter.baseAttackBonus || 0}
                              </span>
                            </div>
                            <div>
                              <strong style={{ color: 'var(--text-primary)' }}>CMB:</strong>{' '}
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {(currentCharacter.cmb || 0) >= 0 ? '+' : ''}{currentCharacter.cmb || 0}
                              </span>
                            </div>
                            <div>
                              <strong style={{ color: 'var(--text-primary)' }}>CMD:</strong>{' '}
                              <span style={{ color: 'var(--text-secondary)' }}>{currentCharacter.cmd || 10}</span>
                            </div>
                          </div>
                          {currentCharacter.weapons && currentCharacter.weapons.length > 0 && (
                            <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>Weapons</strong>
                              {currentCharacter.weapons.map((weapon: any, idx: number) => (
                                <div key={idx} style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: '4px' }}>
                                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.85rem' }}>{weapon.name}</div>
                                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                    {weapon.attackBonus && `+${weapon.attackBonus} `}
                                    {weapon.damage && `(${weapon.damage})`}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Feats & Abilities */}
                      {((currentCharacter.feats && currentCharacter.feats.length > 0) ||
                        (currentCharacter.specialAbilities && currentCharacter.specialAbilities.length > 0)) && (
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Feats & Special Abilities</h3>
                          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            {currentCharacter.feats && currentCharacter.feats.length > 0 && (
                              <div style={{ marginBottom: currentCharacter.specialAbilities?.length > 0 ? '0.75rem' : 0 }}>
                                <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>Feats</strong>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                  {currentCharacter.feats.map((feat: string, idx: number) => (
                                    <span key={idx} style={{
                                      padding: '0.25rem 0.5rem',
                                      background: 'var(--bg-primary)',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      color: 'var(--text-secondary)'
                                    }}>
                                      {feat}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {currentCharacter.specialAbilities && currentCharacter.specialAbilities.length > 0 && (
                              <div>
                                <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>Special Abilities</strong>
                                {currentCharacter.specialAbilities.map((ability: string, idx: number) => (
                                  <div key={idx} style={{
                                    marginTop: '0.5rem',
                                    padding: '0.5rem',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    color: 'var(--text-secondary)'
                                  }}>
                                    {ability}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      {currentCharacter.skills && Object.keys(currentCharacter.skills).length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Skills</h3>
                          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', fontSize: '0.8rem' }}>
                              {Object.entries(currentCharacter.skills).map(([skillName, skillData]: [string, any]) => (
                                <div
                                  key={skillName}
                                  onClick={() => handleRoll('', 'skill', skillName)}
                                  style={{
                                    display: 'contents',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <div
                                    style={{
                                      color: 'var(--text-primary)',
                                      padding: '0.25rem',
                                      borderRadius: '4px',
                                      transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-2)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                  >
                                    {skillName}
                                  </div>
                                  <div
                                    style={{
                                      color: 'var(--text-secondary)',
                                      fontWeight: 'bold',
                                      padding: '0.25rem',
                                      borderRadius: '4px',
                                      transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-2)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                  >
                                    {skillData.total >= 0 ? '+' : ''}{skillData.total || 0}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {currentDocument && !currentDocument.isFolder ? (
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <Editor
                    document={currentDocument}
                    onSave={(content) => {
                      api.post('/documents/document', {
                        id: currentDocument.id,
                        name: currentDocument.name,
                        content
                      });
                    }}
                  />
                </div>
              ) : !currentCharacter ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#8e9297'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <FileText size={64} style={{ margin: '0 auto 1rem' }} />
                    <p>Select a document or character to start</p>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
