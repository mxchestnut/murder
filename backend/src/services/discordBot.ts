import { Client, GatewayIntentBits, Message, EmbedBuilder, Webhook, TextChannel, NewsChannel } from 'discord.js';
import { db } from '../db';
import { channelCharacterMappings, characterSheets, users } from '../db/schema';
import { eq, and, or, sql } from 'drizzle-orm';

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

async function handleHelp(message: Message) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('📖 Cyarika Bot Commands')
    .setDescription('Roll dice, proxy as characters, and manage your Pathfinder characters!')
    .addFields(
      { name: '!setchar <name>', value: 'Link this channel to a character', inline: false },
      { name: '!char', value: 'Show which character is linked to this channel', inline: false },
      { name: '!roll <stat/save/skill>', value: 'Roll a check for the linked character', inline: false },
      { name: '!CharName <stat/save/skill>', value: 'Roll a check for any character by name\nExample: `!Ogun strength`', inline: false },
      { name: 'CharName: message', value: 'Speak as a character (proxying)\nExample: `Ogun: Hello everyone!`', inline: false },
      { name: '!help', value: 'Show this help message', inline: false }
    )
    .setFooter({ text: 'Cyarika Portal v1.0' });

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
