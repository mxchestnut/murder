import { Client, GatewayIntentBits, Message, EmbedBuilder, Webhook, TextChannel, NewsChannel } from 'discord.js';
import { db } from '../db';
import { channelCharacterMappings, characterSheets, users } from '../db/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import * as PlayFabService from './playfab';
import crypto from 'crypto';

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
    await message.author.send('❌ **Usage:** `!connect <username/email> <password>`\n\n' +
      '⚠️ **Security Note:** This command has been deleted from the channel. Your credentials are only stored encrypted in the database.\n\n' +
      '**Example:** `!connect myemail@example.com mypassword`\n\n' +
      'After connecting, you can use `!syncall` to import all your PathCompanion characters.');
    return;
  }

  const username = args[0];
  const password = args.slice(1).join(' '); // Allow passwords with spaces

  try {
    // Send a DM to the user for privacy
    await message.author.send('🔐 Connecting to PathCompanion...');

    // Try to login to PathCompanion
    const auth = await PlayFabService.loginToPlayFab(username, password);

    // Get the user record
    const userRecords = await db.select().from(users).limit(1);
    if (userRecords.length === 0) {
      await message.author.send('❌ No user found in database. Please create an account on the Cyarika Portal first.');
      return;
    }

    const user = userRecords[0];

    // Encrypt and store the credentials
    const encryptedPassword = encryptPassword(password);

    await db.update(users)
      .set({
        pathCompanionUsername: username,
        pathCompanionPassword: encryptedPassword,
        pathCompanionSessionTicket: auth.sessionTicket,
        pathCompanionPlayfabId: auth.playfabId,
        pathCompanionConnectedAt: new Date()
      })
      .where(eq(users.id, user.id));

    await message.author.send('✅ **Successfully connected to PathCompanion!**\n\n' +
      `Account: ${username}\n` +
      `PlayFab ID: ${auth.playfabId}\n\n` +
      'You can now use `!syncall` to import all your characters from PathCompanion.');

    console.log(`PathCompanion connected for user via Discord: ${username}`);

  } catch (error) {
    console.error('Discord PathCompanion connect error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    await message.author.send('❌ **Failed to connect to PathCompanion.**\n\n' +
      `Error: ${errorMsg}\n\n` +
      'Please check your username/email and password and try again.');
  }
}

async function handleSyncAll(message: Message) {
  await message.reply('🔄 Syncing all characters from PathCompanion... This may take a moment.');

  try {
    // Get the user (assuming single user for now - you may want to expand this)
    const userRecords = await db.select().from(users).limit(1);
    if (userRecords.length === 0) {
      await message.reply('❌ No PathCompanion account linked. Please log into the Cyarika Portal first.');
      return;
    }

    const user = userRecords[0];
    const userId = user.id;

    // Check if we have credentials stored
    if (!user.pathCompanionUsername || !user.pathCompanionPassword) {
      await message.reply('❌ No PathCompanion credentials stored for syncing.\n\n' +
        '**Option 1 (Portal):** Log in at http://54.242.214.56 and import characters there\n' +
        '**Option 2 (Discord):** Use `!connect <email> <password>` to sync from Discord\n\n' +
        '💡 Once characters are imported, you can roll and proxy without any credentials!');
      return;
    }

    // Try to get session ticket, refresh if needed
    let sessionTicket: string;
    
    // Get user data from PathCompanion (this will throw if session is invalid)
    let userData;
    try {
      // If we don't have a session ticket yet, or if it's null, refresh immediately
      if (!user.pathCompanionSessionTicket) {
        console.log('No session ticket, refreshing...');
        await message.reply('🔄 Connecting to PathCompanion...');
        sessionTicket = await refreshPathCompanionSession(user);
      } else {
        sessionTicket = user.pathCompanionSessionTicket;
      }
      
      userData = await PlayFabService.getUserData(sessionTicket);
    } catch (error: any) {
      // If session expired, automatically refresh it
      if (error.message?.includes('Must be logged in') || error.message?.includes('session')) {
        console.log('Session expired, auto-refreshing...');
        await message.reply('🔄 Session expired, refreshing automatically...');
        sessionTicket = await refreshPathCompanionSession(user);
        userData = await PlayFabService.getUserData(sessionTicket);
      } else {
        throw error;
      }
    }

    // Filter to character entries only
    const characterKeys = Object.keys(userData)
      .filter(key => /^character\d+$/.test(key))
      .slice(0, 50);

    if (characterKeys.length === 0) {
      await message.reply('ℹ️ No characters found in your PathCompanion account.');
      return;
    }

    const results: {
      success: Array<{ name: string; action: string }>;
      failed: Array<{ id: string; reason: string }>;
    } = {
      success: [],
      failed: []
    };

    // Import each character
    for (const characterId of characterKeys) {
      try {
        const character = await PlayFabService.getCharacter(sessionTicket, characterId);

        if (!character) {
          results.failed.push({ id: characterId, reason: 'Character not found' });
          continue;
        }

        // Extract all data
        const abilities = PlayFabService.extractAbilityScores(character.data);
        const level = PlayFabService.extractCharacterLevel(character.data);
        const combatStats = PlayFabService.extractCombatStats(character.data);
        const saves = PlayFabService.extractSavingThrows(character.data);
        const basicInfo = PlayFabService.extractBasicInfo(character.data);
        const skills = PlayFabService.extractSkills(character.data);
        const feats = PlayFabService.extractFeats(character.data);
        const specialAbilities = PlayFabService.extractSpecialAbilities(character.data);
        const weapons = PlayFabService.extractWeapons(character.data);
        const armor = PlayFabService.extractArmor(character.data);
        const spells = PlayFabService.extractSpells(character.data);

        // Check if character already exists
        const existing = await db.select().from(characterSheets).where(
          eq(characterSheets.pathCompanionId, characterId)
        );

        if (existing.length > 0) {
          // Update existing character
          await db.update(characterSheets)
            .set({
              name: character.characterName,
              strength: abilities.strength,
              dexterity: abilities.dexterity,
              constitution: abilities.constitution,
              intelligence: abilities.intelligence,
              wisdom: abilities.wisdom,
              charisma: abilities.charisma,
              characterClass: character.data.class || character.data.className,
              level: level,
              race: basicInfo.race,
              alignment: basicInfo.alignment,
              deity: basicInfo.deity,
              size: basicInfo.size,
              avatarUrl: basicInfo.avatarUrl,
              currentHp: combatStats.currentHp,
              maxHp: combatStats.maxHp,
              tempHp: combatStats.tempHp,
              armorClass: combatStats.armorClass,
              touchAc: combatStats.touchAc,
              flatFootedAc: combatStats.flatFootedAc,
              initiative: combatStats.initiative,
              speed: combatStats.speed,
              baseAttackBonus: combatStats.baseAttackBonus,
              cmb: combatStats.cmb,
              cmd: combatStats.cmd,
              fortitudeSave: saves.fortitudeSave,
              reflexSave: saves.reflexSave,
              willSave: saves.willSave,
              skills: JSON.stringify(skills),
              feats: JSON.stringify(feats),
              specialAbilities: JSON.stringify(specialAbilities),
              weapons: JSON.stringify(weapons),
              armor: JSON.stringify(armor),
              spells: JSON.stringify(spells),
              pathCompanionData: JSON.stringify(character.data),
              pathCompanionSession: sessionTicket,
              lastSynced: new Date(),
              updatedAt: new Date()
            })
            .where(eq(characterSheets.id, existing[0].id));

          results.success.push({ name: character.characterName, action: 'updated' });
        } else {
          // Create new character
          await db.insert(characterSheets).values({
            userId,
            name: character.characterName,
            strength: abilities.strength,
            dexterity: abilities.dexterity,
            constitution: abilities.constitution,
            intelligence: abilities.intelligence,
            wisdom: abilities.wisdom,
            charisma: abilities.charisma,
            characterClass: character.data.class || character.data.className,
            level: level,
            race: basicInfo.race,
            alignment: basicInfo.alignment,
            deity: basicInfo.deity,
            size: basicInfo.size,
            avatarUrl: basicInfo.avatarUrl,
            currentHp: combatStats.currentHp,
            maxHp: combatStats.maxHp,
            tempHp: combatStats.tempHp,
            armorClass: combatStats.armorClass,
            touchAc: combatStats.touchAc,
            flatFootedAc: combatStats.flatFootedAc,
            initiative: combatStats.initiative,
            speed: combatStats.speed,
            baseAttackBonus: combatStats.baseAttackBonus,
            cmb: combatStats.cmb,
            cmd: combatStats.cmd,
            fortitudeSave: saves.fortitudeSave,
            reflexSave: saves.reflexSave,
            willSave: saves.willSave,
            skills: JSON.stringify(skills),
            feats: JSON.stringify(feats),
            specialAbilities: JSON.stringify(specialAbilities),
            weapons: JSON.stringify(weapons),
            armor: JSON.stringify(armor),
            spells: JSON.stringify(spells),
            pathCompanionData: JSON.stringify(character.data),
            pathCompanionSession: sessionTicket,
            pathCompanionId: characterId,
            isPathCompanion: true,
            lastSynced: new Date()
          });

          results.success.push({ name: character.characterName, action: 'imported' });
        }
      } catch (error) {
        console.error(`Failed to sync character ${characterId}:`, error);
        results.failed.push({ 
          id: characterId, 
          reason: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    // Send success message
    const imported = results.success.filter(r => r.action === 'imported').length;
    const updated = results.success.filter(r => r.action === 'updated').length;
    const failed = results.failed.length;

    let resultMessage = '✅ **PathCompanion Sync Complete!**\n';
    if (imported > 0) resultMessage += `\n• **${imported}** character${imported !== 1 ? 's' : ''} imported`;
    if (updated > 0) resultMessage += `\n• **${updated}** character${updated !== 1 ? 's' : ''} updated`;
    if (failed > 0) resultMessage += `\n• ⚠️ **${failed}** character${failed !== 1 ? 's' : ''} failed`;

    if (results.success.length > 0) {
      resultMessage += '\n\n**Characters:**\n' + results.success.map(r => `• ${r.name} (${r.action})`).join('\n');
    }

    await message.reply(resultMessage);

  } catch (error) {
    console.error('Error in handleSyncAll:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes('No PathCompanion credentials')) {
      // Already handled above with specific message
      return;
    } else if (errorMsg.includes('Invalid encrypted password')) {
      await message.reply('❌ **Stored credentials are corrupted.**\n\n' +
        'Please reconnect with `!connect <email> <password>`\n\n' +
        '⚠️ Your message will be deleted immediately for security.');
    } else {
      await message.reply('❌ Failed to sync characters. Error: ' + errorMsg);
    }
  }
}

async function handleHelp(message: Message) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('📖 Cyarika Bot Commands')
    .setDescription('🎲 **Getting Started:**\n1. Import characters (Portal or `!connect` + `!syncall`)\n2. Roll & proxy forever (no credentials needed!)\n\n**Commands:**')
    .addFields(
      { name: '🎭 Using Characters (No Login Required)', value: '`!CharName <stat/save/skill>` - Roll for any character\n`CharName: message` - Speak as a character\n`!setchar <name>` - Link character to channel\n`!roll <stat>` - Roll for linked character', inline: false },
      { name: '📥 Importing Characters', value: '**Portal:** http://54.242.214.56 (recommended)\n**Discord:** `!connect <email> <password>` then `!syncall`\n\n💡 Import once, characters stored in our database!', inline: false },
      { name: '🔄 Syncing/Updating', value: '`!syncall` - Refresh all characters from PathCompanion\n(Requires prior `!connect` or portal login)', inline: false },
      { name: 'ℹ️ Other', value: '`!char` - Show linked character\n`!help` - Show this message', inline: false }
    )
    .setFooter({ text: 'Your character data is stored securely - no PathCompanion needed for rolling!' });

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
      webhook = webhooks.find(wh => wh.owner?.id === botClient?.user?.id && wh.name === 'Cyarika Proxy');
      
      if (!webhook) {
        // Create new webhook
        webhook = await channel.createWebhook({
          name: 'Cyarika Proxy',
          reason: 'Character proxying for Cyarika Portal'
        });
      }
      
      webhookCache.set(channel.id, webhook);
    }

    // Delete the original message
    await message.delete().catch(() => {});

    // Send message as character
    const avatarUrl = character.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(character.name) + '&size=256&background=random';
    
    await webhook.send({
      content: messageText,
      username: character.name,
      avatarURL: avatarUrl
    });

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
