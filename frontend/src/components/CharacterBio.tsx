import { useState, useEffect } from 'react';
import { 
  User, Target, Brain, Smile, Palette, Sword, BookOpen, 
  Users, Eye, TrendingUp, Award, ChevronDown, ChevronRight, Save, Edit3 
} from 'lucide-react';
import { api } from '../utils/api';
import RichTextModal from './RichTextModal';

interface CharacterBioProps {
  character: any;
  onUpdate: () => void;
}

export default function CharacterBio({ character, onUpdate }: CharacterBioProps) {
  const [bioData, setBioData] = useState({
    // Basic Identity
    fullName: character.fullName || '',
    titles: character.titles || '',
    species: character.species || '',
    ageDescription: character.ageDescription || '',
    culturalBackground: character.culturalBackground || '',
    pronouns: character.pronouns || '',
    genderIdentity: character.genderIdentity || '',
    sexuality: character.sexuality || '',
    occupation: character.occupation || '',
    currentLocation: character.currentLocation || '',
    // Goals & Motivations
    currentGoal: character.currentGoal || '',
    longTermDesire: character.longTermDesire || '',
    coreMotivation: character.coreMotivation || '',
    deepestFear: character.deepestFear || '',
    coreBelief: character.coreBelief || '',
    coreMisconception: character.coreMisconception || '',
    moralCode: character.moralCode || '',
    alignmentTendency: character.alignmentTendency || '',
    // Personality
    personalityOneSentence: character.personalityOneSentence || '',
    keyVirtues: character.keyVirtues || '',
    keyFlaws: character.keyFlaws || '',
    stressBehavior: character.stressBehavior || '',
    habitsOrTells: character.habitsOrTells || '',
    speechStyle: character.speechStyle || '',
    // Appearance
    physicalPresence: character.physicalPresence || '',
    identifyingTraits: character.identifyingTraits || '',
    clothingAesthetic: character.clothingAesthetic || '',
    // Skills
    notableEquipment: character.notableEquipment || '',
    skillsReliedOn: character.skillsReliedOn || '',
    skillsAvoided: character.skillsAvoided || '',
    // Backstory
    origin: character.origin || '',
    greatestSuccess: character.greatestSuccess || '',
    greatestFailure: character.greatestFailure || '',
    regret: character.regret || '',
    trauma: character.trauma || '',
    // Relationships
    importantRelationships: character.importantRelationships || '',
    protectedRelationship: character.protectedRelationship || '',
    avoidedRelationship: character.avoidedRelationship || '',
    rival: character.rival || '',
    affiliatedGroups: character.affiliatedGroups || '',
    // Beliefs
    beliefsPhilosophy: character.beliefsPhilosophy || '',
    // Public vs Private
    publicFacade: character.publicFacade || '',
    hiddenAspect: character.hiddenAspect || '',
    secret: character.secret || '',
    // Growth
    recentChange: character.recentChange || '',
    potentialChange: character.potentialChange || '',
    breakingPoint: character.breakingPoint || '',
    redemption: character.redemption || '',
    // Legacy
    symbolOrMotif: character.symbolOrMotif || '',
    legacy: character.legacy || '',
    rememberedAs: character.rememberedAs || ''
  });

  const [expandedSections, setExpandedSections] = useState({
    identity: true,
    goals: false,
    personality: false,
    appearance: false,
    skills: false,
    backstory: false,
    relationships: false,
    beliefs: false,
    publicPrivate: false,
    growth: false,
    legacy: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [richTextModal, setRichTextModal] = useState<{
    isOpen: boolean;
    field: string;
    label: string;
    placeholder: string;
  }>({
    isOpen: false,
    field: '',
    label: '',
    placeholder: ''
  });

  useEffect(() => {
    // Update bio data when character changes
    setBioData({
      fullName: character.fullName || '',
      titles: character.titles || '',
      species: character.species || '',
      ageDescription: character.ageDescription || '',
      culturalBackground: character.culturalBackground || '',
      pronouns: character.pronouns || '',
      genderIdentity: character.genderIdentity || '',
      sexuality: character.sexuality || '',
      occupation: character.occupation || '',
      currentLocation: character.currentLocation || '',
      currentGoal: character.currentGoal || '',
      longTermDesire: character.longTermDesire || '',
      coreMotivation: character.coreMotivation || '',
      deepestFear: character.deepestFear || '',
      coreBelief: character.coreBelief || '',
      coreMisconception: character.coreMisconception || '',
      moralCode: character.moralCode || '',
      alignmentTendency: character.alignmentTendency || '',
      personalityOneSentence: character.personalityOneSentence || '',
      keyVirtues: character.keyVirtues || '',
      keyFlaws: character.keyFlaws || '',
      stressBehavior: character.stressBehavior || '',
      habitsOrTells: character.habitsOrTells || '',
      speechStyle: character.speechStyle || '',
      physicalPresence: character.physicalPresence || '',
      identifyingTraits: character.identifyingTraits || '',
      clothingAesthetic: character.clothingAesthetic || '',
      notableEquipment: character.notableEquipment || '',
      skillsReliedOn: character.skillsReliedOn || '',
      skillsAvoided: character.skillsAvoided || '',
      origin: character.origin || '',
      greatestSuccess: character.greatestSuccess || '',
      greatestFailure: character.greatestFailure || '',
      regret: character.regret || '',
      trauma: character.trauma || '',
      importantRelationships: character.importantRelationships || '',
      protectedRelationship: character.protectedRelationship || '',
      avoidedRelationship: character.avoidedRelationship || '',
      rival: character.rival || '',
      affiliatedGroups: character.affiliatedGroups || '',
      beliefsPhilosophy: character.beliefsPhilosophy || '',
      publicFacade: character.publicFacade || '',
      hiddenAspect: character.hiddenAspect || '',
      secret: character.secret || '',
      recentChange: character.recentChange || '',
      potentialChange: character.potentialChange || '',
      breakingPoint: character.breakingPoint || '',
      redemption: character.redemption || '',
      symbolOrMotif: character.symbolOrMotif || '',
      legacy: character.legacy || '',
      rememberedAs: character.rememberedAs || ''
    });
  }, [character]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !(prev as any)[section]
    }));
  };

  const handleChange = (field: string, value: string) => {
    setBioData(prev => ({ ...prev, [field]: value }));
  };

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

  const renderInput = (field: string, label: string, placeholder: string) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ 
        display: 'block', 
        color: 'var(--text-primary)', 
        fontSize: '0.85rem', 
        marginBottom: '0.5rem', 
        fontWeight: 500 
      }}>
        {label}
      </label>
      <input
        type="text"
        value={(bioData as any)[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        placeholder={placeholder}
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
  );

  const renderTextarea = (field: string, label: string, placeholder: string, rows: number = 3) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ 
        display: 'block', 
        color: 'var(--text-primary)', 
        fontSize: '0.85rem', 
        marginBottom: '0.5rem', 
        fontWeight: 500 
      }}>
        {label}
      </label>
      <textarea
        value={(bioData as any)[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        placeholder={placeholder}
        rows={rows}
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
  );

  const renderRichTextarea = (field: string, label: string, placeholder: string, rows: number = 4) => {
    // Strip HTML tags for preview display
    const stripHTML = (html: string) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };
    
    const currentValue = (bioData as any)[field];
    const previewText = stripHTML(currentValue);
    const hasContent = previewText.trim().length > 0;
    
    return (
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          color: 'var(--text-primary)', 
          fontSize: '0.85rem', 
          marginBottom: '0.5rem', 
          fontWeight: 500 
        }}>
          {label}
        </label>
        <div
          onClick={() => setRichTextModal({ isOpen: true, field, label, placeholder })}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '6px',
            border: '2px dashed var(--border-color)',
            background: hasContent ? 'var(--bg-secondary)' : 'var(--bg-primary)',
            color: hasContent ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
            minHeight: `${rows * 1.5}rem`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.background = 'var(--bg-secondary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.background = hasContent ? 'var(--bg-secondary)' : 'var(--bg-primary)';
          }}
        >
          <Edit3 size={16} style={{ flexShrink: 0, opacity: 0.5 }} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {hasContent ? previewText : placeholder}
          </span>
          <span style={{ 
            fontSize: '0.75rem', 
            opacity: 0.6,
            flexShrink: 0 
          }}>
            Click to edit
          </span>
        </div>
      </div>
    );
  };

  const renderSection = (
    key: string,
    icon: any,
    title: string,
    children: React.ReactNode
  ) => {
    const Icon = icon;
    const isExpanded = (expandedSections as any)[key];

    return (
      <div style={{
        marginBottom: '1rem',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <div
          onClick={() => toggleSection(key)}
          style={{
            padding: '1rem',
            background: isExpanded ? 'var(--bg-secondary)' : 'var(--bg-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            userSelect: 'none',
            borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none'
          }}
        >
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <Icon size={18} style={{ color: 'var(--accent-color)' }} />
          <span style={{ 
            color: 'var(--text-primary)', 
            fontWeight: 600, 
            fontSize: '0.95rem' 
          }}>
            {title}
          </span>
        </div>
        {isExpanded && (
          <div style={{ padding: '1.5rem' }}>
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      padding: '1.5rem',
      background: 'var(--bg-primary)',
      borderRadius: '8px',
      border: '1px solid var(--border-color)',
      marginBottom: '1.5rem'
    }}>
      {/* Avatar Section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', gap: '0.75rem' }}>
        {character.avatarUrl ? (
          <img 
            src={character.avatarUrl} 
            alt={character.name}
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '4px solid var(--accent-color)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          />
        ) : (
          <div
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              border: '3px dashed var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--background-secondary)',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              textAlign: 'center',
              padding: '1rem'
            }}
          >
            No Avatar
          </div>
        )}
        <input
          type="file"
          id="bio-avatar-upload"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              try {
                const formData = new FormData();
                formData.append('avatar', file);
                
                const uploadResponse = await api.post('/characters/upload-avatar', formData, {
                  headers: {
                    'Content-Type': 'multipart/form-data'
                  }
                });
                const avatarUrl = uploadResponse.data.url;
                
                await api.put(`/characters/${character.id}`, { avatarUrl });
                onUpdate();
                setMessage({ type: 'success', text: 'Avatar uploaded successfully!' });
                setTimeout(() => setMessage(null), 3000);
              } catch (error) {
                console.error('Error uploading avatar:', error);
                setMessage({ type: 'error', text: 'Failed to upload avatar' });
                setTimeout(() => setMessage(null), 3000);
              }
            }
            e.target.value = '';
          }}
        />
        <button
          onClick={() => document.getElementById('bio-avatar-upload')?.click()}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            background: 'var(--background-secondary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          {character.avatarUrl ? 'Change Avatar' : 'Upload Avatar'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={20} />
          Character Profile
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

      {renderSection('identity', User, 'Basic Identity', (
        <>
          {renderInput('fullName', 'Full Name', 'e.g., Aria Stormwind')}
          {renderInput('titles', 'Titles, Epithets, or Aliases', 'e.g., The Wanderer, Stormcaller')}
          {renderInput('species', 'Species / Ancestry', 'e.g., Half-elf, Human, Tiefling')}
          {renderInput('ageDescription', 'Age or Life Stage', 'e.g., 25 years, Young adult, Ancient')}
          {renderInput('culturalBackground', 'Cultural Background', 'e.g., Raised in coastal trading city')}
          {renderInput('pronouns', 'Pronouns', 'e.g., she/her, he/him, they/them')}
          {renderInput('genderIdentity', 'Gender Identity', 'e.g., Woman, Non-binary, Genderfluid')}
          {renderInput('sexuality', 'Sexuality', 'e.g., Bisexual, Asexual, Pansexual')}
          {renderInput('occupation', 'Occupation or Role', 'e.g., Mercenary, Scholar, Innkeeper')}
          {renderInput('currentLocation', 'Current Location', 'e.g., Waterdeep, On the road')}
        </>
      ))}

      {renderSection('goals', Target, 'Goals & Motivations', (
        <>
          {renderTextarea('currentGoal', 'Current Goal', 'What are they trying to achieve right now?')}
          {renderTextarea('longTermDesire', 'Long-term Desire', 'What do they ultimately want?')}
          {renderTextarea('coreMotivation', 'Core Motivation', 'What drives them forward?')}
          {renderTextarea('deepestFear', 'Deepest Fear', 'What terrifies them most?')}
          {renderTextarea('coreBelief', 'Core Belief About the World', 'What fundamental truth do they hold?')}
          {renderTextarea('coreMisconception', 'Core Misconception or Lie They Believe', 'What falsehood shapes their worldview?')}
          {renderTextarea('moralCode', 'Moral Code or Red Line They Will Not Cross', 'What lines won\'t they cross?')}
          {renderInput('alignmentTendency', 'Alignment or Ethical Tendency', 'e.g., Chaotic Good, Lawful Neutral')}
        </>
      ))}

      {renderSection('personality', Smile, 'Personality', (
        <>
          {renderTextarea('personalityOneSentence', 'Personality in One Sentence', 'Sum up their personality')}
          {renderInput('keyVirtues', 'Key Virtues', 'e.g., Brave, Compassionate, Honest')}
          {renderInput('keyFlaws', 'Key Flaws', 'e.g., Impulsive, Stubborn, Cynical')}
          {renderTextarea('stressBehavior', 'Stress Behavior', 'How do they act under pressure?')}
          {renderTextarea('habitsOrTells', 'Habits or Tells', 'Nervous tics, repeated phrases, mannerisms')}
          {renderTextarea('speechStyle', 'Speech Style or Voice Notes', 'How do they speak? Accent, vocabulary, tone')}
        </>
      ))}

      {renderSection('appearance', Palette, 'Appearance', (
        <>
          {renderTextarea('physicalPresence', 'Physical Presence (Overall Impression)', 'First impression they make')}
          {renderTextarea('identifyingTraits', 'Identifying Physical Traits', 'Scars, tattoos, unique features')}
          {renderTextarea('clothingAesthetic', 'Clothing or Gear Aesthetic', 'Style, colors, practical or decorative?')}
        </>
      ))}

      {renderSection('skills', Sword, 'Skills & Abilities', (
        <>
          {renderTextarea('notableEquipment', 'Notable Equipment or Abilities', 'Signature weapons, magic items, powers')}
          {renderTextarea('skillsReliedOn', 'Skills They Rely On Most', 'What are they good at?')}
          {renderTextarea('skillsAvoided', 'Skills They Avoid or Lack', 'What do they struggle with?')}
        </>
      ))}

      {renderSection('backstory', BookOpen, 'Backstory', (
        <>
          {renderRichTextarea('origin', 'Origin or Formative Past Event', 'Where did they come from? What shaped them?', 4)}
          {renderRichTextarea('greatestSuccess', 'Greatest Success', 'Their proudest moment', 3)}
          {renderRichTextarea('greatestFailure', 'Greatest Failure', 'Their biggest mistake or loss', 3)}
          {renderRichTextarea('regret', 'Regret or Unresolved Guilt', 'What haunts them?', 3)}
          {renderRichTextarea('trauma', 'Trauma or Defining Wound (Optional)', 'Deep emotional or physical scars', 3)}
        </>
      ))}

      {renderSection('relationships', Users, 'Relationships', (
        <>
          {renderRichTextarea('importantRelationships', 'Important Relationships', 'Family, friends, mentors, lovers', 4)}
          {renderRichTextarea('protectedRelationship', 'Relationship They Protect', 'Who would they die for?', 3)}
          {renderRichTextarea('avoidedRelationship', 'Relationship They Avoid or Fear', 'Who do they keep at distance?', 3)}
          {renderRichTextarea('rival', 'Rival or Opposing Force', 'Their nemesis or antagonist', 3)}
          {renderTextarea('affiliatedGroups', 'Affiliated Groups or Factions', 'Guilds, orders, organizations they belong to', 3)}
        </>
      ))}

      {renderSection('beliefs', Brain, 'Beliefs & Philosophy', (
        <>
          {renderTextarea('beliefsPhilosophy', 'Beliefs, Faith, or Philosophy', 'Religious views, personal code, worldview', 4)}
        </>
      ))}

      {renderSection('publicPrivate', Eye, 'Public vs Private Self', (
        <>
          {renderTextarea('publicFacade', 'What They Want Others to See', 'The mask they wear', 3)}
          {renderTextarea('hiddenAspect', 'What They Hide', 'True feelings, vulnerabilities', 3)}
          {renderTextarea('secret', 'Secret (Known or Unknown to Others)', 'Hidden truth about them', 3)}
        </>
      ))}

      {renderSection('growth', TrendingUp, 'Growth & Change', (
        <>
          {renderRichTextarea('recentChange', 'How They\'ve Changed Recently', 'Recent character development', 3)}
          {renderRichTextarea('potentialChange', 'How They Might Change Next', 'Potential arc or growth', 3)}
          {renderRichTextarea('breakingPoint', 'What Would Break Them', 'What could destroy them?', 3)}
          {renderRichTextarea('redemption', 'What Could Redeem Them', 'Path to healing or salvation', 3)}
        </>
      ))}

      {renderSection('legacy', Award, 'Legacy & Symbol', (
        <>
          {renderInput('symbolOrMotif', 'Symbol, Motif, or Image Associated with Them', 'e.g., A raven, storm clouds, a broken sword')}
          {renderTextarea('legacy', 'Legacy or Impact on the World', 'What mark will they leave?', 3)}
          {renderTextarea('rememberedAs', 'If They Died Today, How Would They Be Remembered?', 'Their epitaph or legend', 3)}
        </>
      ))}

      <RichTextModal
        isOpen={richTextModal.isOpen}
        onClose={() => setRichTextModal({ ...richTextModal, isOpen: false })}
        onSave={(value) => handleChange(richTextModal.field, value)}
        initialValue={(bioData as any)[richTextModal.field] || ''}
        label={richTextModal.label}
        placeholder={richTextModal.placeholder}
        maxLength={1024}
      />
    </div>
  );
}
