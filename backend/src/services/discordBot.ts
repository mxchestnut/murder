import { Client, GatewayIntentBits, Message, EmbedBuilder, Webhook, TextChannel, NewsChannel } from 'discord.js';
import { db } from '../db';
import { channelCharacterMappings, characterSheets, users } from '../db/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import * as PlayFabService from './playfab';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import axios from 'axios';

let botClient: Client | null = null;
const webhookCache = new Map<string, Webhook>(); // channelId -> webhook

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
    const proxyMatch = content.match(/^!?([A-Za-z0-9\s]+):\s*(.+)$/);
    if (proxyMatch) {
      await handleProxy(message, proxyMatch[1].trim(), proxyMatch[2]);
      return;
    }

    // Check for name-based rolling: "!CharName stat"
    const nameRollMatch = content.match(/^!([A-Za-z0-9\s]+)\s+(.+)$/);
    if (nameRollMatch) {
      const potentialName = nameRollMatch[1].trim();
      const potentialStat = nameRollMatch[2].trim();
      
      // Check if this is a known command first
      const knownCommands = ['setchar', 'char', 'roll', 'help'];
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
    // Profile for a specific character by name
    const characterName = args.join(' ');
    const characters = await db
      .select()
      .from(characterSheets)
      .where(eq(characterSheets.name, characterName));

    if (characters.length === 0) {
      await message.reply(`❌ Character "${characterName}" not found.`);
      return;
    }

    character = characters[0];
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

  // Basic Info
  const basicInfo = [];
  if (character.characterClass) basicInfo.push(`**Class:** ${character.characterClass}`);
  if (character.race) basicInfo.push(`**Race:** ${character.race}`);
  if (character.level) basicInfo.push(`**Level:** ${character.level}`);
  if (character.alignment) basicInfo.push(`**Alignment:** ${character.alignment}`);
  if (basicInfo.length > 0) {
    embed.addFields({ name: '⚔️ Basic Info', value: basicInfo.join('\n'), inline: false });
  }

  // Bio Info
  const bioInfo = [];
  if (character.pronouns) bioInfo.push(`**Pronouns:** ${character.pronouns}`);
  if (character.sexuality) bioInfo.push(`**Sexuality:** ${character.sexuality}`);
  if (character.age) bioInfo.push(`**Age:** ${character.age}`);
  if (character.height) bioInfo.push(`**Height:** ${character.height}`);
  if (character.weight) bioInfo.push(`**Weight:** ${character.weight}`);
  if (bioInfo.length > 0) {
    embed.addFields({ name: '👤 Bio', value: bioInfo.join('\n'), inline: false });
  }

  // Appearance
  if (character.appearance) {
    const truncatedAppearance = character.appearance.length > 1024 
      ? character.appearance.substring(0, 1021) + '...' 
      : character.appearance;
    embed.addFields({ name: '🎨 Appearance', value: truncatedAppearance, inline: false });
  }

  // Personality
  if (character.personality) {
    const truncatedPersonality = character.personality.length > 1024 
      ? character.personality.substring(0, 1021) + '...' 
      : character.personality;
    embed.addFields({ name: '😊 Personality', value: truncatedPersonality, inline: false });
  }

  // Backstory
  if (character.backstory) {
    const truncatedBackstory = character.backstory.length > 1024 
      ? character.backstory.substring(0, 1021) + '...' 
      : character.backstory;
    embed.addFields({ name: '📖 Backstory', value: truncatedBackstory, inline: false });
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
    console.error('Discord Cyarika connect error:', error);
    
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
      await message.reply('ℹ️ **No characters found in your Cyarika account.**\n\n' +
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
    // Find character by name (case-insensitive)
    const characters = await db
      .select()
      .from(characterSheets)
      .where(sql`LOWER(${characterSheets.name}) = LOWER(${characterName})`);

    if (characters.length === 0) {
      // Silently ignore if character not found (might just be regular text)
      return;
    }

    const character = characters[0];
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
    // Find character by name (case-insensitive)
    const characters = await db
      .select()
      .from(characterSheets)
      .where(sql`LOWER(${characterSheets.name}) = LOWER(${characterName})`);

    if (characters.length === 0) {
      return false; // Not a character name
    }

    const character = characters[0];

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
          .setFooter({ text: 'Rolled from Cyarika Portal' })
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

export function getDiscordBot() {
  return botClient;
}
