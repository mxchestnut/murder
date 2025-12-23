import { Client, GatewayIntentBits, Message, EmbedBuilder, Webhook, TextChannel, NewsChannel } from 'discord.js';
import { db } from '../db';
import { channelCharacterMappings, characterSheets, users, knowledgeBase, characterStats, activityFeed, relationships } from '../db/schema';
import { eq, and, or, sql, desc } from 'drizzle-orm';
import * as PlayFabService from './playfab';
import * as GeminiService from './gemini';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import axios from 'axios';

let botClient: Client | null = null;
const webhookCache = new Map<string, Webhook>(); // channelId -> webhook

// Normalize string by removing accents and converting to lowercase
function normalizeString(str: string): string {
  return str
    .normalize('NFD') // Decompose combined characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .toLowerCase()
    .trim();
}

export function initializeDiscordBot(token: string) {
  if (!token) {
    console.log('No Discord bot token provided, skipping bot initialization');
    return;
  }

  botClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  botClient.on('ready', () => {
    console.log(`Discord bot logged in as ${botClient?.user?.tag}`);
  });

  botClient.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return;

    const content = message.content.trim();

    // Check for character proxying patterns: "CharName: message" or "!CharName: message"
    const proxyMatch = content.match(/^!?([\p{L}\p{N}\s]+):\s*(.+)$/u);
    if (proxyMatch) {
      await handleProxy(message, proxyMatch[1].trim(), proxyMatch[2]);
      return;
    }

    // Check for name-based rolling: "!CharName stat"
    const nameRollMatch = content.match(/^!([\p{L}\p{N}\s]+)\s+(.+)$/u);
    if (nameRollMatch) {
      const potentialName = nameRollMatch[1].trim();
      const potentialStat = nameRollMatch[2].trim();
      
      // Check if this is a known command first
      const knownCommands = ['setchar', 'char', 'roll', 'help', 'profile', 'connect', 'syncall', 'ask', 'learn', 'stats', 'leaderboard'];
      if (!knownCommands.includes(potentialName.toLowerCase())) {
        // Try to handle as name-based roll
        const handled = await handleNameRoll(message, potentialName, potentialStat);
        if (handled) return;
      }
    }

    // Standard command handling
    if (!content.startsWith('!')) return;

    const args = content.slice(1).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    try {
      switch (command) {
        case 'setchar':
          await handleSetChar(message, args);
          break;
        case 'char':
          await handleShowChar(message);
          break;
        case 'profile':
          await handleProfile(message, args);
          break;
        case 'roll':
          await handleRoll(message, args);
          break;
        case 'connect':
          await handleConnect(message, args);
          break;
        case 'syncall':
          await handleSyncAll(message);
          break;
        case 'ask':
          await handleAsk(message, args);
          break;
        case 'learn':
          await handleLearn(message, args);
          break;
        case 'stats':
          await handleStats(message, args);
          break;
        case 'leaderboard':
          await handleLeaderboard(message, args);
          break;
        case 'help':
          await handleHelp(message);
          break;
      }
    } catch (error) {
      console.error('Error handling Discord command:', error);
      await message.reply('❌ An error occurred processing your command.');
    }
  });

  botClient.login(token).catch(error => {
    console.error('Failed to login Discord bot:', error);
  });
}

async function handleSetChar(message: Message, args: string[]) {
  if (args.length === 0) {
    await message.reply('Usage: `!setchar <character_name>`\nExample: `!setchar Ogun`');
    return;
  }

  const characterName = args.join(' ');
  const channelId = message.channel.id;
  const guildId = message.guild?.id || '';

  // Find character by name (case-insensitive)
  const characters = await db
    .select()
    .from(characterSheets)
    .where(eq(characterSheets.name, characterName));

  if (characters.length === 0) {
    await message.reply(`❌ Character "${characterName}" not found. Check spelling and try again.`);
    return;
  }

  const character = characters[0];

  // Get user info to store mapping
  const userRecords = await db.select().from(users).limit(1);
  if (userRecords.length === 0) {
    await message.reply('❌ No users found in database.');
    return;
  }
  const userId = userRecords[0].id;

  // Check if mapping exists
  const existing = await db
    .select()
    .from(channelCharacterMappings)
    .where(
      and(
        eq(channelCharacterMappings.channelId, channelId),
        eq(channelCharacterMappings.guildId, guildId)
      )
    );

  if (existing.length > 0) {
    // Update existing mapping
    await db
      .update(channelCharacterMappings)
      .set({ characterId: character.id })
      .where(
        and(
          eq(channelCharacterMappings.channelId, channelId),
          eq(channelCharacterMappings.guildId, guildId)
        )
      );
  } else {
    // Create new mapping
    await db.insert(channelCharacterMappings).values({
      channelId,
      guildId,
      characterId: character.id,
      userId,
    });
  }

  await message.reply(`✅ This channel is now linked to **${character.name}**! Rolls from the portal will appear here.`);
}

async function handleShowChar(message: Message) {
  const channelId = message.channel.id;
  const guildId = message.guild?.id || '';

  const mapping = await db
    .select()
    .from(channelCharacterMappings)
    .innerJoin(characterSheets, eq(channelCharacterMappings.characterId, characterSheets.id))
    .where(
      and(
        eq(channelCharacterMappings.channelId, channelId),
        eq(channelCharacterMappings.guildId, guildId)
      )
    );

  if (mapping.length === 0) {
    await message.reply('❌ No character is linked to this channel. Use `!setchar <name>` to link one.');
    return;
  }

  const character = mapping[0].character_sheets;
  await message.reply(`📋 This channel is linked to **${character.name}** (Level ${character.level} ${character.characterClass || 'Character'})`);
}

async function handleProfile(message: Message, args: string[]) {
  let character: any;

  if (args.length > 0) {
    // Profile for a specific character by name (fuzzy matching)
    const characterName = args.join(' ');
    const normalizedInput = normalizeString(characterName);
    
    const allCharacters = await db
      .select()
      .from(characterSheets);
    
    const matchedCharacters = allCharacters.filter(char => 
      normalizeString(char.name) === normalizedInput
    );

    if (matchedCharacters.length === 0) {
      await message.reply(`❌ Character "${characterName}" not found.`);
      return;
    }

    character = matchedCharacters[0];
  } else {
    // Profile for channel-linked character
    const channelId = message.channel.id;
    const guildId = message.guild?.id || '';

    const mapping = await db
      .select()
      .from(channelCharacterMappings)
      .innerJoin(characterSheets, eq(channelCharacterMappings.characterId, characterSheets.id))
      .where(
        and(
          eq(channelCharacterMappings.channelId, channelId),
          eq(channelCharacterMappings.guildId, guildId)
        )
      );

    if (mapping.length === 0) {
      await message.reply('❌ No character linked to this channel. Use `!profile <character_name>` or `!setchar <name>` first.');
      return;
    }

    character = mapping[0].character_sheets;
  }

  // Build profile embed
  const embed = new EmbedBuilder()
    .setTitle(`${character.name}`)
    .setColor('#6366f1');

  if (character.avatarUrl) {
    embed.setThumbnail(character.avatarUrl);
  }

  // Helper function to truncate long text
  const truncate = (text: string, maxLength: number = 1024): string => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  // Basic Info (Pathfinder stats)
  const basicInfo = [];
  if (character.characterClass) basicInfo.push(`**Class:** ${character.characterClass}`);
  if (character.race) basicInfo.push(`**Race:** ${character.race}`);
  if (character.level) basicInfo.push(`**Level:** ${character.level}`);
  if (character.alignment) basicInfo.push(`**Alignment:** ${character.alignment}`);
  if (basicInfo.length > 0) {
    embed.addFields({ name: '⚔️ Basic Info', value: basicInfo.join('\n'), inline: false });
  }

  // Identity Section
  const identityInfo = [];
  if (character.fullName && character.fullName !== character.name) identityInfo.push(`**Full Name:** ${character.fullName}`);
  if (character.titles) identityInfo.push(`**Titles:** ${character.titles}`);
  if (character.species) identityInfo.push(`**Species:** ${character.species}`);
  if (character.ageDescription) identityInfo.push(`**Age:** ${character.ageDescription}`);
  if (character.culturalBackground) identityInfo.push(`**Culture:** ${character.culturalBackground}`);
  if (character.pronouns) identityInfo.push(`**Pronouns:** ${character.pronouns}`);
  if (character.genderIdentity) identityInfo.push(`**Gender:** ${character.genderIdentity}`);
  if (character.sexuality) identityInfo.push(`**Sexuality:** ${character.sexuality}`);
  if (character.occupation) identityInfo.push(`**Occupation:** ${character.occupation}`);
  if (character.currentLocation) identityInfo.push(`**Location:** ${character.currentLocation}`);
  if (identityInfo.length > 0) {
    embed.addFields({ name: '👤 Identity', value: truncate(identityInfo.join('\n')), inline: false });
  }

  // Goals & Motivations
  const goalsInfo = [];
  if (character.currentGoal) goalsInfo.push(`**Current Goal:** ${character.currentGoal}`);
  if (character.longTermDesire) goalsInfo.push(`**Long-term Desire:** ${character.longTermDesire}`);
  if (character.coreMotivation) goalsInfo.push(`**Core Motivation:** ${character.coreMotivation}`);
  if (character.deepestFear) goalsInfo.push(`**Deepest Fear:** ${character.deepestFear}`);
  if (character.alignmentTendency) goalsInfo.push(`**Alignment:** ${character.alignmentTendency}`);
  if (goalsInfo.length > 0) {
    embed.addFields({ name: '🎯 Goals & Motivations', value: truncate(goalsInfo.join('\n')), inline: false });
  }

  // Personality
  const personalityInfo = [];
  if (character.personalityOneSentence) personalityInfo.push(`*${character.personalityOneSentence}*`);
  if (character.keyVirtues) personalityInfo.push(`**Virtues:** ${character.keyVirtues}`);
  if (character.keyFlaws) personalityInfo.push(`**Flaws:** ${character.keyFlaws}`);
  if (character.stressBehavior) personalityInfo.push(`**Under Stress:** ${character.stressBehavior}`);
  if (character.habitsOrTells) personalityInfo.push(`**Habits:** ${character.habitsOrTells}`);
  if (character.speechStyle) personalityInfo.push(`**Speech:** ${character.speechStyle}`);
  if (personalityInfo.length > 0) {
    embed.addFields({ name: '😊 Personality', value: truncate(personalityInfo.join('\n')), inline: false });
  }

  // Appearance
  const appearanceInfo = [];
  if (character.physicalPresence) appearanceInfo.push(`**Presence:** ${character.physicalPresence}`);
  if (character.identifyingTraits) appearanceInfo.push(`**Traits:** ${character.identifyingTraits}`);
  if (character.clothingAesthetic) appearanceInfo.push(`**Style:** ${character.clothingAesthetic}`);
  if (appearanceInfo.length > 0) {
    embed.addFields({ name: '🎨 Appearance', value: truncate(appearanceInfo.join('\n')), inline: false });
  }

  // Skills & Abilities
  const skillsInfo = [];
  if (character.notableEquipment) skillsInfo.push(`**Equipment:** ${character.notableEquipment}`);
  if (character.skillsReliedOn) skillsInfo.push(`**Strengths:** ${character.skillsReliedOn}`);
  if (character.skillsAvoided) skillsInfo.push(`**Weaknesses:** ${character.skillsAvoided}`);
  if (skillsInfo.length > 0) {
    embed.addFields({ name: '⚔️ Skills', value: truncate(skillsInfo.join('\n')), inline: false });
  }

  // Backstory (consolidated from multiple markdown fields)
  if (character.origin) {
    embed.addFields({ name: '📖 Origin', value: truncate(character.origin), inline: false });
  }
  
  const backstoryNotes = [];
  if (character.greatestSuccess) backstoryNotes.push(`**Greatest Success:** ${character.greatestSuccess}`);
  if (character.greatestFailure) backstoryNotes.push(`**Greatest Failure:** ${character.greatestFailure}`);
  if (character.regret) backstoryNotes.push(`**Regret:** ${character.regret}`);
  if (backstoryNotes.length > 0) {
    embed.addFields({ name: '🏆 Defining Moments', value: truncate(backstoryNotes.join('\n\n')), inline: false });
  }

  // Relationships
  if (character.importantRelationships) {
    embed.addFields({ name: '👥 Relationships', value: truncate(character.importantRelationships), inline: false });
  }

  const relationshipNotes = [];
  if (character.protectedRelationship) relationshipNotes.push(`**Would Die For:** ${character.protectedRelationship}`);
  if (character.rival) relationshipNotes.push(`**Rival:** ${character.rival}`);
  if (character.affiliatedGroups) relationshipNotes.push(`**Groups:** ${character.affiliatedGroups}`);
  if (relationshipNotes.length > 0) {
    embed.addFields({ name: '🤝 Key Connections', value: truncate(relationshipNotes.join('\n')), inline: false });
  }

  // Beliefs & Philosophy
  if (character.beliefsPhilosophy) {
    embed.addFields({ name: '🧠 Beliefs', value: truncate(character.beliefsPhilosophy), inline: false });
  }
  if (character.coreBelief) {
    embed.addFields({ name: '💭 Core Belief', value: truncate(character.coreBelief), inline: false });
  }

  // Secrets & Hidden Aspects
  const secretsInfo = [];
  if (character.publicFacade) secretsInfo.push(`**Public Face:** ${character.publicFacade}`);
  if (character.hiddenAspect) secretsInfo.push(`**Hidden:** ${character.hiddenAspect}`);
  if (character.secret) secretsInfo.push(`**Secret:** ${character.secret}`);
  if (secretsInfo.length > 0) {
    embed.addFields({ name: '👁️ Public vs Private', value: truncate(secretsInfo.join('\n')), inline: false });
  }

  // Character Arc
  const arcInfo = [];
  if (character.recentChange) arcInfo.push(`**Recent Change:** ${character.recentChange}`);
  if (character.potentialChange) arcInfo.push(`**Potential Growth:** ${character.potentialChange}`);
  if (arcInfo.length > 0) {
    embed.addFields({ name: '📈 Character Arc', value: truncate(arcInfo.join('\n')), inline: false });
  }

  // Legacy
  const legacyInfo = [];
  if (character.symbolOrMotif) legacyInfo.push(`**Symbol:** ${character.symbolOrMotif}`);
  if (character.legacy) legacyInfo.push(`**Legacy:** ${character.legacy}`);
  if (character.rememberedAs) legacyInfo.push(`**Remembered As:** ${character.rememberedAs}`);
  if (legacyInfo.length > 0) {
    embed.addFields({ name: '🌟 Legacy', value: truncate(legacyInfo.join('\n')), inline: false });
  }

  // Stats
  const statModifier = (stat: number) => {
    const mod = Math.floor((stat - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const statsInfo = [
    `**STR:** ${character.strength} (${statModifier(character.strength)})`,
    `**DEX:** ${character.dexterity} (${statModifier(character.dexterity)})`,
    `**CON:** ${character.constitution} (${statModifier(character.constitution)})`,
    `**INT:** ${character.intelligence} (${statModifier(character.intelligence)})`,
    `**WIS:** ${character.wisdom} (${statModifier(character.wisdom)})`,
    `**CHA:** ${character.charisma} (${statModifier(character.charisma)})`
  ];
  embed.addFields({ name: '📊 Ability Scores', value: statsInfo.join(' • '), inline: false });

  // Combat Stats
  const combatInfo = [
    `**HP:** ${character.currentHp || 0}/${character.maxHp || 0}`,
    `**AC:** ${character.armorClass || 10}`,
    `**Initiative:** ${(character.initiative || 0) >= 0 ? '+' : ''}${character.initiative || 0}`,
    `**Speed:** ${character.speed || 30}ft`
  ];
  embed.addFields({ name: '⚔️ Combat', value: combatInfo.join(' • '), inline: false });

  embed.setFooter({ text: `Use !roll <stat> to roll for ${character.name}` });

  await message.reply({ embeds: [embed] });
}

async function handleRoll(message: Message, args: string[]) {
  if (args.length === 0) {
    await message.reply('Usage: `!roll <stat/save/skill>`\nExamples: `!roll strength`, `!roll fortitude`, `!roll perception`');
    return;
  }

  const channelId = message.channel.id;
  const guildId = message.guild?.id || '';

  // Get linked character
  const mapping = await db
    .select()
    .from(channelCharacterMappings)
    .innerJoin(characterSheets, eq(channelCharacterMappings.characterId, characterSheets.id))
    .where(
      and(
        eq(channelCharacterMappings.channelId, channelId),
        eq(channelCharacterMappings.guildId, guildId)
      )
    );

  if (mapping.length === 0) {
    await message.reply('❌ No character linked to this channel. Use `!setchar <name>` first.');
    return;
  }

  const character = mapping[0].character_sheets;
  const rollParam = args.join(' ').toLowerCase();

  // Determine roll type and calculate
  let rollType = 'ability';
  let modifier = 0;
  let rollDescription = '';
  let statName = rollParam;

  // Check if it's an ability score
  const abilityScores = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  if (abilityScores.some(stat => rollParam.includes(stat))) {
    const stat = abilityScores.find(s => rollParam.includes(s))!;
    modifier = Math.floor(((character as any)[stat] - 10) / 2);
    rollDescription = `${stat.charAt(0).toUpperCase() + stat.slice(1)} Check`;
    statName = stat;
  } 
  // Check if it's a save
  else if (rollParam.includes('fortitude') || rollParam === 'fort') {
    rollType = 'save';
    modifier = character.fortitudeSave || 0;
    rollDescription = 'Fortitude Save';
    statName = 'fortitude';
  } else if (rollParam.includes('reflex') || rollParam === 'ref') {
    rollType = 'save';
    modifier = character.reflexSave || 0;
    rollDescription = 'Reflex Save';
    statName = 'reflex';
  } else if (rollParam.includes('will')) {
    rollType = 'save';
    modifier = character.willSave || 0;
    rollDescription = 'Will Save';
    statName = 'will';
  }
  // Check if it's a skill
  else {
    rollType = 'skill';
    const skills = character.skills as any;
    if (skills && typeof skills === 'object') {
      const skillKey = Object.keys(skills).find(k => k.toLowerCase().includes(rollParam));
      if (skillKey && skills[skillKey]) {
        modifier = skills[skillKey].total || 0;
        rollDescription = `${skillKey} Check`;
        statName = skillKey;
      } else {
        await message.reply(`❌ Skill "${rollParam}" not found on ${character.name}.`);
        return;
      }
    } else {
      await message.reply(`❌ "${rollParam}" not recognized. Try an ability, save, or skill name.`);
      return;
    }
  }

  // Roll the dice
  const diceRoll = Math.floor(Math.random() * 20) + 1;
  const total = diceRoll + modifier;

  // Create embed
  const embed = new EmbedBuilder()
    .setColor(diceRoll === 20 ? 0x00ff00 : diceRoll === 1 ? 0xff0000 : 0x0099ff)
    .setTitle(`🎲 ${character.name} - ${rollDescription}`)
    .setDescription(`**${diceRoll}** ${modifier >= 0 ? '+' : ''}${modifier} = **${total}**`)
    .setFooter({ text: `Rolled by ${message.author.username}` })
    .setTimestamp();

  if (diceRoll === 20) {
    embed.addFields({ name: '🎉', value: 'Natural 20!', inline: true });
  } else if (diceRoll === 1) {
    embed.addFields({ name: '💀', value: 'Natural 1!', inline: true });
  }

  await message.reply({ embeds: [embed] });

  // Track stats
  await trackCharacterActivity(character.id, 'roll', `Rolled ${rollDescription}: ${total}`, {
    diceRoll,
    modifier,
    total,
    stat: statName,
    nat20: diceRoll === 20,
    nat1: diceRoll === 1
  });
}

// Encryption utilities for PathCompanion password
const ENCRYPTION_KEY = process.env.PATHCOMPANION_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';

function encryptPassword(password: string): string {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptPassword(encryptedPassword: string): string {
  const parts = encryptedPassword.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted password format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Automatically refresh PathCompanion session if expired
async function refreshPathCompanionSession(user: any): Promise<string> {
  if (!user.pathCompanionUsername || !user.pathCompanionPassword) {
    throw new Error('No PathCompanion credentials stored. Please use !connect first.');
  }

  console.log(`Auto-refreshing PathCompanion session for user ${user.pathCompanionUsername}`);

  // Decrypt stored password
  const password = decryptPassword(user.pathCompanionPassword);

  // Re-authenticate with PathCompanion
  const auth = await PlayFabService.loginToPlayFab(user.pathCompanionUsername, password);

  // Update session ticket in database
  await db.update(users)
    .set({
      pathCompanionSessionTicket: auth.sessionTicket,
      pathCompanionConnectedAt: new Date()
    })
    .where(eq(users.id, user.id));

  console.log(`Successfully refreshed session for ${user.pathCompanionUsername}`);
  return auth.sessionTicket;
}

async function handleConnect(message: Message, args: string[]) {
  // Delete the message immediately to protect credentials
  await message.delete().catch(() => {});

  if (args.length < 2) {
    await message.author.send('❌ **Usage:** `!connect <username> <password>`\n\n' +
      '⚠️ **Security Note:** This command has been deleted from the channel. Your credentials are only used for authentication.\n\n' +
      '**Example:** `!connect myusername mypassword`\n\n' +
      '🔗 **Linking your Discord account** to Write Pretend will allow you to:\n' +
      '• Use all your Write Pretend characters in Discord\n' +
      '• Roll dice with your character stats\n' +
      '• Proxy messages as your characters\n\n' +
      '💡 Don\'t have a Write Pretend account? Create one at http://writepretend.com');
    return;
  }

  const username = args[0];
  const password = args.slice(1).join(' '); // Allow passwords with spaces

  try {
    // Send a DM to the user for privacy
    await message.author.send('🔐 Connecting to Write Pretend...');

    // Authenticate with Cyarika backend
    const API_URL = process.env.API_URL || 'http://localhost:3000';
    const response = await axios.post(`${API_URL}/api/discord/login`, {
      username,
      password,
      discordUserId: message.author.id
    });

    const { user, characters } = response.data;

    await message.author.send('✅ **Successfully connected to Write Pretend!**\n\n' +
      `🎭 Account: **${user.username}**\n` +
      `🎲 Characters: **${characters.length}**\n` +
      (user.pathCompanionConnected ? '🔗 PathCompanion: **Connected**\n' : '') +
      '\n**Your available characters:**\n' +
      characters.map((c: any) => `• ${c.name}${c.isPathCompanion ? ' (PathCompanion)' : ''}`).join('\n') +
      '\n\n**Next steps:**\n' +
      '• Use `!setchar <name>` in a channel to link it to a character\n' +
      '• Use `!roll <stat>` to roll dice\n' +
      '• Type `CharName: message` to proxy as that character\n' +
      '• Use `!help` for more commands');

    console.log(`Discord account ${message.author.tag} (${message.author.id}) linked to Write Pretend user: ${username}`);

  } catch (error: any) {
    console.error('Discord Write Pretend connect error:', error);
    
    let errorMsg = 'Unknown error occurred';
    if (error.response?.data?.error) {
      errorMsg = error.response.data.error;
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    await message.author.send('❌ **Failed to connect to Write Pretend.**\n\n' +
      `Error: ${errorMsg}\n\n` +
      'Please check your username and password and try again.\n\n' +
      '💡 Need help? Visit http://writepretend.com to manage your account.');
  }
}

async function handleSyncAll(message: Message) {
  await message.reply('🔄 Refreshing your character list from Write Pretend...');

  try {
    // Get user by Discord ID
    const [user] = await db.select()
      .from(users)
      .where(eq(users.discordUserId, message.author.id));

    if (!user) {
      await message.reply('❌ **Discord account not linked to Cyarika.**\n\n' +
        '**To link your account:**\n' +
        '1. Use `!connect <username> <password>` in Discord, OR\n' +
        '2. Visit http://54.242.214.56 to create/manage your account\n\n' +
        '💡 Once linked, all your Cyarika characters will be available!');
      return;
    }

    // Get all characters for this user
    const characters = await db.select()
      .from(characterSheets)
      .where(eq(characterSheets.userId, user.id));

    if (characters.length === 0) {
      await message.reply('ℹ️ **No characters found in your Write Pretend account.**\n\n' +
        '**Create characters:**\n' +
        '• Visit http://54.242.214.56 and create a character manually\n' +
        (user.pathCompanionUsername ? '• Or import from PathCompanion in the web portal\n' : '') +
        '\n💡 Characters you create will automatically be available in Discord!');
      return;
    }

    // Build response with character list
    const charList = characters.map(c => 
      `• **${c.name}** - Level ${c.level} ${c.characterClass || 'Character'}${c.isPathCompanion ? ' (PathCompanion)' : ''}`
    ).join('\n');

    await message.reply(`✅ **Synced ${characters.length} character${characters.length !== 1 ? 's' : ''}!**\n\n` +
      charList +
      '\n\n**Usage:**\n' +
      '• `!setchar <name>` - Link a channel to a character\n' +
      '• `!roll <stat>` - Roll dice for your character\n' +
      '• `CharName: message` - Proxy as a character');

  } catch (error) {
    console.error('Discord syncall error:', error);
    await message.reply('❌ Failed to sync characters. Please try again or check your connection.');
  }
}

async function handleHelp(message: Message) {
  const embed = new EmbedBuilder()
    .setColor(0x6B46C1) // Write Pretend purple
    .setTitle('🎭 Write Pretend Bot Commands')
    .setDescription('✨ **Getting Started:**\n1. Link your Discord to Write Pretend with `!connect`\n2. Your characters are automatically available!\n\n**Commands:**')
    .addFields(
      { name: '🔗 Account Setup', value: '`!connect <username> <password>` - Link Discord to Write Pretend\n`!syncall` - Refresh character list\n\n💡 Create an account at http://writepretend.com', inline: false },
      { name: '🎭 Using Characters', value: '`!CharName <stat/save/skill>` - Roll for any character\n`CharName: message` - Speak as a character\n`!setchar <name>` - Link character to channel\n`!roll <stat>` - Roll for linked character\n`!profile [name]` - View character bio/profile', inline: false },
      { name: '📥 Creating Characters', value: '**Web Portal:** http://writepretend.com (recommended)\n• Create manually with name + stats\n• Import from PathCompanion (optional)\n\n✨ All characters instantly available in Discord!', inline: false },
      { name: 'ℹ️ Other', value: '`!char` - Show linked character\n`!help` - Show this message', inline: false }
    )
    .setFooter({ text: 'PathCompanion is optional - create characters directly in Write Pretend!' });

  await message.reply({ embeds: [embed] });
}

async function handleProxy(message: Message, characterName: string, messageText: string) {
  try {
    // Find character by name (fuzzy matching - normalize accents)
    const normalizedInput = normalizeString(characterName);
    
    // Get all characters and filter in JavaScript for fuzzy matching
    const allCharacters = await db
      .select()
      .from(characterSheets);
    
    const matchedCharacters = allCharacters.filter(char => 
      normalizeString(char.name) === normalizedInput
    );

    if (matchedCharacters.length === 0) {
      // Silently ignore if character not found (might just be regular text)
      return;
    }

    const character = matchedCharacters[0];
    const channel = message.channel;

    // Only work in text channels
    if (!(channel instanceof TextChannel || channel instanceof NewsChannel)) {
      return;
    }

    // Get or create webhook for this channel
    let webhook = webhookCache.get(channel.id);
    
    if (!webhook) {
      // Check if a webhook already exists
      const webhooks = await channel.fetchWebhooks();
      webhook = webhooks.find(wh => wh.owner?.id === botClient?.user?.id && wh.name === 'Write Pretend Proxy');
      
      if (!webhook) {
        // Create new webhook
        webhook = await channel.createWebhook({
          name: 'Write Pretend Proxy',
          reason: 'Character proxying for Write Pretend Portal'
        });
      }
      
      webhookCache.set(channel.id, webhook);
    }

    // Delete the original message
    await message.delete().catch(() => {});

    // Convert relative avatar URL to absolute URL
    let avatarUrl = character.avatarUrl;
    console.log('Original avatarUrl from character:', avatarUrl);
    
    if (avatarUrl && avatarUrl.startsWith('/')) {
      // Relative URL, make it absolute
      const baseUrl = process.env.FRONTEND_URL || 'http://54.242.214.56';
      avatarUrl = baseUrl + avatarUrl;
      console.log('Converted to absolute URL:', avatarUrl);
    } else if (!avatarUrl) {
      // No avatar, use default
      avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(character.name) + '&size=256&background=random';
      console.log('Using default avatar URL:', avatarUrl);
    }
    
    try {
      await webhook.send({
        content: messageText,
        username: character.name,
        avatarURL: avatarUrl
      });

      // Track stats
      await trackCharacterActivity(character.id, 'message', `Sent message in ${channel.name}`, {
        messageLength: messageText.length,
        channelId: channel.id
      });

    } catch (webhookError: any) {
      // If webhook fails (e.g., Unknown Webhook error), clear cache and retry once
      if (webhookError.code === 10015) {
        console.log('Webhook became invalid, clearing cache and retrying...');
        webhookCache.delete(channel.id);
        
        // Recreate webhook
        const webhooks = await channel.fetchWebhooks();
        webhook = webhooks.find(wh => wh.owner?.id === botClient?.user?.id && wh.name === 'Write Pretend Proxy');
        
        if (!webhook) {
          webhook = await channel.createWebhook({
            name: 'Write Pretend Proxy',
            reason: 'Character proxying for Write Pretend Portal'
          });
        }
        
        webhookCache.set(channel.id, webhook);
        
        // Retry send
        await webhook.send({
          content: messageText,
          username: character.name,
          avatarURL: avatarUrl
        });
      } else {
        throw webhookError;
      }
    }

  } catch (error) {
    console.error('Error in handleProxy:', error);
  }
}

async function handleNameRoll(message: Message, characterName: string, rollParam: string): Promise<boolean> {
  try {
    // Find character by name (fuzzy matching - normalize accents)
    const normalizedInput = normalizeString(characterName);
    
    // Get all characters and filter in JavaScript for fuzzy matching
    const allCharacters = await db
      .select()
      .from(characterSheets);
    
    const matchedCharacters = allCharacters.filter(char => 
      normalizeString(char.name) === normalizedInput
    );

    if (matchedCharacters.length === 0) {
      return false; // Not a character name
    }

    const character = matchedCharacters[0];

    // Determine roll type and calculate
    let rollType = 'ability';
    let modifier = 0;
    let rollDescription = '';
    let statName = rollParam.toLowerCase();

    // Check if it's an ability score
    const abilityScores = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    const matchedAbility = abilityScores.find(stat => statName.includes(stat));
    
    if (matchedAbility) {
      modifier = Math.floor(((character as any)[matchedAbility] - 10) / 2);
      rollDescription = `${matchedAbility.charAt(0).toUpperCase() + matchedAbility.slice(1)} Check`;
    } 
    // Check if it's a save
    else if (statName.includes('fortitude') || statName === 'fort') {
      rollType = 'save';
      modifier = character.fortitudeSave || 0;
      rollDescription = 'Fortitude Save';
    } else if (statName.includes('reflex') || statName === 'ref') {
      rollType = 'save';
      modifier = character.reflexSave || 0;
      rollDescription = 'Reflex Save';
    } else if (statName.includes('will')) {
      rollType = 'save';
      modifier = character.willSave || 0;
      rollDescription = 'Will Save';
    }
    // Check if it's a skill
    else {
      rollType = 'skill';
      const skills = character.skills as any;
      
      console.log(`[handleNameRoll] Character: ${character.name}, Skills type: ${typeof skills}, Skills:`, skills);
      
      if (skills && typeof skills === 'object' && Object.keys(skills).length > 0) {
        // Try exact match first, then partial match
        let skillKey = Object.keys(skills).find(k => k.toLowerCase() === statName);
        if (!skillKey) {
          // Try partial match - check if the search term is in the skill name
          skillKey = Object.keys(skills).find(k => k.toLowerCase().includes(statName));
        }
        if (!skillKey) {
          // Try reverse - check if skill name starts with search term
          skillKey = Object.keys(skills).find(k => statName.includes(k.toLowerCase()));
        }
        
        console.log(`[handleNameRoll] Skill search for "${statName}", found: ${skillKey}`);
        
        if (skillKey && skills[skillKey]) {
          modifier = skills[skillKey].total || 0;
          rollDescription = `${skillKey} Check`;
        } else {
          await message.reply(`❌ Skill "${rollParam}" not found on ${character.name}. Available skills: ${Object.keys(skills).join(', ')}`);
          return true;
        }
      } else {
        await message.reply(`❌ ${character.name} has no skills configured. Please import from PathCompanion or manually add skills.`);
        return true;
      }
    }

    // Roll the dice
    const diceRoll = Math.floor(Math.random() * 20) + 1;
    const total = diceRoll + modifier;

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(diceRoll === 20 ? 0x00ff00 : diceRoll === 1 ? 0xff0000 : 0x0099ff)
      .setTitle(`🎲 ${character.name} - ${rollDescription}`)
      .setDescription(`**${diceRoll}** ${modifier >= 0 ? '+' : ''}${modifier} = **${total}**`)
      .setFooter({ text: `Rolled by ${message.author.username}` })
      .setTimestamp();

    if (diceRoll === 20) {
      embed.addFields({ name: '🎉', value: 'Natural 20!', inline: true });
    } else if (diceRoll === 1) {
      embed.addFields({ name: '💀', value: 'Natural 1!', inline: true });
    }

    await message.reply({ embeds: [embed] });
    
    // Track the roll in character stats
    await trackCharacterActivity(
      character.id, 
      'roll', 
      `Rolled ${rollDescription} in #${message.channel && 'name' in message.channel ? message.channel.name : 'unknown'}`,
      {
        type: rollType,
        stat: rollDescription,
        roll: diceRoll,
        modifier: modifier,
        total: total,
        nat20: diceRoll === 20,
        nat1: diceRoll === 1,
        channelId: message.channelId
      }
    );
    
    return true;

  } catch (error) {
    console.error('Error in handleNameRoll:', error);
    return false;
  }
}


export async function sendRollToDiscord(characterId: number, rollData: any) {
  if (!botClient) {
    console.log('Discord bot not initialized');
    return false;
  }

  // Find all channels linked to this character
  const mappings = await db
    .select()
    .from(channelCharacterMappings)
    .innerJoin(characterSheets, eq(channelCharacterMappings.characterId, characterSheets.id))
    .where(eq(channelCharacterMappings.characterId, characterId));

  if (mappings.length === 0) {
    console.log(`No channels linked to character ${characterId}`);
    return false;
  }

  const character = mappings[0].character_sheets;
  let sentCount = 0;

  for (const mapping of mappings) {
    try {
      const channel = await botClient.channels.fetch(mapping.channel_character_mappings.channelId);
      if (channel && channel.isTextBased() && 'send' in channel) {
        const embed = new EmbedBuilder()
          .setColor(rollData.diceRoll === 20 ? 0x00ff00 : rollData.diceRoll === 1 ? 0xff0000 : 0x0099ff)
          .setTitle(`🎲 ${character.name} - ${rollData.rollDescription}`)
          .setDescription(`**${rollData.diceRoll}** ${rollData.modifier >= 0 ? '+' : ''}${rollData.modifier} = **${rollData.total}**`)
          .setFooter({ text: 'Rolled from Write Pretend Portal' })
          .setTimestamp();

        if (rollData.diceRoll === 20) {
          embed.addFields({ name: '🎉', value: 'Natural 20!', inline: true });
        } else if (rollData.diceRoll === 1) {
          embed.addFields({ name: '💀', value: 'Natural 1!', inline: true });
        }

        await channel.send({ embeds: [embed] });
        sentCount++;
      }
    } catch (error) {
      console.error(`Failed to send roll to channel ${mapping.channel_character_mappings.channelId}:`, error);
    }
  }

  return sentCount > 0;
}

// AI FAQ System
async function handleAsk(message: Message, args: string[]) {
  if (args.length === 0) {
    await message.reply('Usage: `!ask <question>`\nExample: `!ask How does sneak attack work?`');
    return;
  }

  const question = args.join(' ');
  
  try {
    // First, search knowledge base
    const searchResults = await db.select()
      .from(knowledgeBase)
      .where(sql`LOWER(${knowledgeBase.question}) LIKE LOWER(${'%' + question + '%'})`)
      .limit(1);

    if (searchResults.length > 0) {
      const kb = searchResults[0];
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('📚 Knowledge Base')
        .setDescription(kb.answer)
        .addFields(
          { name: 'Question', value: kb.question, inline: false },
          { name: 'Source', value: kb.aiGenerated ? '🤖 AI Generated' : (kb.sourceUrl || 'Manual Entry'), inline: true }
        )
        .setFooter({ text: `👍 ${kb.upvotes || 0} upvotes • React ⭐ to save AI answers` })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      return;
    }

    // If not in KB, ask AI
    if ('sendTyping' in message.channel) {
      await message.channel.sendTyping();
    }
    const answer = await GeminiService.askGemini(question);

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('🤖 AI Answer')
      .setDescription(answer)
      .addFields({ name: 'Question', value: question, inline: false })
      .setFooter({ text: 'React ⭐ to save this to knowledge base' })
      .setTimestamp();

    const reply = await message.reply({ embeds: [embed] });

    // Add star reaction for saving
    await reply.react('⭐');

    // Listen for star reaction to save to KB
    const filter = (reaction: any, user: any) => {
      return reaction.emoji.name === '⭐' && !user.bot;
    };

    const collector = reply.createReactionCollector({ filter, time: 60000, max: 1 });
    
    collector.on('collect', async () => {
      try {
        await db.insert(knowledgeBase).values({
          question,
          answer,
          aiGenerated: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await message.reply('✅ Saved to knowledge base!');
      } catch (error) {
        console.error('Error saving to knowledge base:', error);
      }
    });

  } catch (error) {
    console.error('Error in !ask command:', error);
    await message.reply('❌ Sorry, I encountered an error answering that question.');
  }
}

async function handleLearn(message: Message, args: string[]) {
  // Check if user has admin permissions
  if (!message.member?.permissions.has('Administrator')) {
    await message.reply('❌ Only administrators can add knowledge base entries.');
    return;
  }

  const fullText = args.join(' ');
  const parts = fullText.split('|').map(p => p.trim());

  if (parts.length !== 2) {
    await message.reply('Usage: `!learn <question> | <answer>`\nExample: `!learn What is AC? | Armor Class is your defense rating`');
    return;
  }

  const [question, answer] = parts;

  try {
    await db.insert(knowledgeBase).values({
      question,
      answer,
      aiGenerated: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await message.reply(`✅ Added to knowledge base!\n**Q:** ${question}\n**A:** ${answer}`);
  } catch (error) {
    console.error('Error in !learn command:', error);
    await message.reply('❌ Failed to add to knowledge base.');
  }
}

// Character Stats
async function handleStats(message: Message, args: string[]) {
  try {
    let characterId: number | null = null;

    if (args.length === 0) {
      // Get character linked to this channel
      const mapping = await db.select()
        .from(channelCharacterMappings)
        .where(and(
          eq(channelCharacterMappings.channelId, message.channel.id),
          eq(channelCharacterMappings.guildId, message.guild?.id || '')
        ))
        .limit(1);

      if (mapping.length === 0) {
        await message.reply('No character linked to this channel. Use `!setchar <character_name>` first.');
        return;
      }
      characterId = mapping[0].characterId;
    } else {
      // Search by character name
      const characterName = args.join(' ');
      const characters = await db.select()
        .from(characterSheets)
        .where(sql`LOWER(${characterSheets.name}) LIKE LOWER(${'%' + characterName + '%'})`)
        .limit(1);

      if (characters.length === 0) {
        await message.reply(`Character "${characterName}" not found.`);
        return;
      }
      characterId = characters[0].id;
    }

    // Get or create stats
    let stats = await db.select()
      .from(characterStats)
      .where(eq(characterStats.characterId, characterId))
      .limit(1);

    if (stats.length === 0) {
      // Create initial stats
      await db.insert(characterStats).values({
        characterId,
        totalMessages: 0,
        totalDiceRolls: 0,
        nat20Count: 0,
        nat1Count: 0,
        totalDamageDealt: 0,
        createdAt: new Date()
      });
      stats = await db.select()
        .from(characterStats)
        .where(eq(characterStats.characterId, characterId))
        .limit(1);
    }

    const stat = stats[0];
    const character = await db.select()
      .from(characterSheets)
      .where(eq(characterSheets.id, characterId))
      .limit(1);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`📊 ${character[0].name} - Stats`)
      .addFields(
        { name: '💬 Messages', value: (stat.totalMessages || 0).toString(), inline: true },
        { name: '🎲 Dice Rolls', value: (stat.totalDiceRolls || 0).toString(), inline: true },
        { name: '🎉 Natural 20s', value: (stat.nat20Count || 0).toString(), inline: true },
        { name: '💀 Natural 1s', value: (stat.nat1Count || 0).toString(), inline: true },
        { name: '⚔️ Damage Dealt', value: (stat.totalDamageDealt || 0).toString(), inline: true },
        { name: '📅 Last Active', value: stat.lastActive ? stat.lastActive.toLocaleString() : 'Never', inline: true }
      )
      .setTimestamp();

    if (character[0].avatarUrl) {
      embed.setThumbnail(character[0].avatarUrl);
    }

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in !stats command:', error);
    await message.reply('❌ Failed to retrieve stats.');
  }
}

async function handleLeaderboard(message: Message, args: string[]) {
  const category = args[0]?.toLowerCase() || 'messages';

  try {
    let orderBy;
    let title;
    let emoji;

    switch (category) {
      case 'messages':
      case 'msg':
        orderBy = desc(characterStats.totalMessages);
        title = '💬 Most Active Characters';
        emoji = '💬';
        break;
      case 'rolls':
      case 'dice':
        orderBy = desc(characterStats.totalDiceRolls);
        title = '🎲 Most Dice Rolls';
        emoji = '🎲';
        break;
      case 'crits':
      case 'nat20':
        orderBy = desc(characterStats.nat20Count);
        title = '🎉 Most Natural 20s';
        emoji = '🎉';
        break;
      case 'fails':
      case 'nat1':
        orderBy = desc(characterStats.nat1Count);
        title = '💀 Most Natural 1s';
        emoji = '💀';
        break;
      case 'damage':
        orderBy = desc(characterStats.totalDamageDealt);
        title = '⚔️ Most Damage Dealt';
        emoji = '⚔️';
        break;
      default:
        await message.reply('Usage: `!leaderboard <messages|rolls|crits|fails|damage>`');
        return;
    }

    const stats = await db.select({
      stats: characterStats,
      character: characterSheets
    })
      .from(characterStats)
      .innerJoin(characterSheets, eq(characterStats.characterId, characterSheets.id))
      .orderBy(orderBy)
      .limit(10);

    if (stats.length === 0) {
      await message.reply('No stats available yet. Start playing to track stats!');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle(title)
      .setTimestamp();

    let description = '';
    stats.forEach((entry, index) => {
      const rank = ['🥇', '🥈', '🥉'][index] || `${index + 1}.`;
      let value;
      
      switch (category) {
        case 'messages':
        case 'msg':
          value = entry.stats.totalMessages;
          break;
        case 'rolls':
        case 'dice':
          value = entry.stats.totalDiceRolls;
          break;
        case 'crits':
        case 'nat20':
          value = entry.stats.nat20Count;
          break;
        case 'fails':
        case 'nat1':
          value = entry.stats.nat1Count;
          break;
        case 'damage':
          value = entry.stats.totalDamageDealt;
          break;
        default:
          value = 0;
      }

      description += `${rank} **${entry.character.name}** - ${emoji} ${value}\n`;
    });

    embed.setDescription(description);
    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in !leaderboard command:', error);
    await message.reply('❌ Failed to retrieve leaderboard.');
  }
}

// Helper function to track character activity and update stats
async function trackCharacterActivity(
  characterId: number, 
  activityType: string, 
  description: string,
  metadata?: any
) {
  try {
    // Get or create stats
    let stats = await db.select()
      .from(characterStats)
      .where(eq(characterStats.characterId, characterId))
      .limit(1);

    if (stats.length === 0) {
      await db.insert(characterStats).values({
        characterId,
        totalMessages: 0,
        totalDiceRolls: 0,
        nat20Count: 0,
        nat1Count: 0,
        totalDamageDealt: 0,
        lastActive: new Date(),
        createdAt: new Date()
      });
      stats = await db.select()
        .from(characterStats)
        .where(eq(characterStats.characterId, characterId))
        .limit(1);
    }

    const stat = stats[0];

    // Update stats based on activity type
    const updates: any = { lastActive: new Date() };

    switch (activityType) {
      case 'message':
        updates.totalMessages = (stat.totalMessages || 0) + 1;
        break;
      case 'roll':
        updates.totalDiceRolls = (stat.totalDiceRolls || 0) + 1;
        if (metadata?.nat20) {
          updates.nat20Count = (stat.nat20Count || 0) + 1;
        }
        if (metadata?.nat1) {
          updates.nat1Count = (stat.nat1Count || 0) + 1;
        }
        if (metadata?.damage) {
          updates.totalDamageDealt = (stat.totalDamageDealt || 0) + metadata.damage;
        }
        break;
    }

    await db.update(characterStats)
      .set(updates)
      .where(eq(characterStats.characterId, characterId));

    // Add to activity feed
    await db.insert(activityFeed).values({
      characterId,
      activityType,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error tracking character activity:', error);
  }
}

export function getDiscordBot() {
  return botClient;
}
