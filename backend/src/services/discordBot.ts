import { Client, GatewayIntentBits, Message, EmbedBuilder, Webhook, TextChannel, NewsChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Partials } from 'discord.js';
import { db } from '../db';
import { channelCharacterMappings, characterSheets, users, knowledgeBase, characterStats, activityFeed, relationships, prompts, tropes, sessions, sessionMessages, scenes, hallOfFame, gmNotes, gameTime, botSettings, hcList, characterMemories } from '../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import * as PlayFabService from './playfab';
import * as GeminiService from './gemini';
import { learnFromUrl } from './gemini';
import node_crypto from 'node:crypto';
import axios from 'axios';
import wiki from 'wikipedia';

let botClient: Client | null = null;
const webhookCache = new Map<string, Webhook>(); // channelId -> webhook

// Normalize string by removing accents and converting to lowercase
function normalizeString(str: string): string {
  return str
    .normalize('NFD') // Decompose combined characters
    .replaceAll(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .toLowerCase()
    .trim();
}

// Check if user has admin permissions
function isAdmin(message: Message): boolean {
  if (!message.member) return false;
  return message.member.permissions.has('Administrator');
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
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Message, Partials.Reaction, Partials.Channel],
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

    // Check for relationship command: "!Character1 is Character2's descriptor | notes"
    const relationshipMatch = content.match(/^!([\p{L}\p{N}\s]+)\s+is\s+([\p{L}\p{N}\s]+)'s\s+/ui);
    if (relationshipMatch) {
      await handleRelationship(message, content);
      return;
    }

    // Check for name-based rolling: "!CharName stat"
    const nameRollMatch = content.match(/^!([\p{L}\p{N}\s]+)\s+(.+)$/u);
    if (nameRollMatch) {
      const potentialName = nameRollMatch[1].trim();
      const potentialStat = nameRollMatch[2].trim();

      // Check if this is a known command first
      const knownCommands = ['setchar', 'char', 'roll', 'help', 'profile', 'connect', 'syncall', 'ask', 'learn', 'learnurl', 'kink', 'feat', 'spell', 'stats', 'leaderboard', 'prompt', 'trope', 'session', 'scene', 'time', 'note', 'npc', 'music', 'recap', 'hall', 'botset', 'hc', 'memory'];
      const isKnownCommand = knownCommands.includes(potentialName.toLowerCase());
      if (!isKnownCommand) {
        // Check if this is "!CharName Memories" pattern
        if (potentialStat.toLowerCase() === 'memories') {
          await handleCharacterMemoriesView(message, potentialName);
          return;
        }
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
        case 'learnurl':
          await handleLearnUrl(message, args);
          break;
        case 'feat':
          await handleFeat(message, args);
          break;
        case 'spell':
          await handleSpell(message, args);
          break;
        case 'stats':
          await handleStats(message, args);
          break;
        case 'leaderboard':
          await handleLeaderboard(message, args);
          break;
        case 'prompt':
          await handlePrompt(message, args);
          break;
        case 'trope':
          await handleTrope(message, args);
          break;
        case 'session':
          await handleSession(message, args);
          break;
        case 'scene':
          await handleScene(message, args);
          break;
        case 'time':
          await handleTime(message, args);
          break;
        case 'note':
          await handleNote(message, args);
          break;
        case 'npc':
          await handleNPC(message, args);
          break;
        case 'music':
          await handleMusic(message);
          break;
        case 'recap':
          await handleRecap(message);
          break;
        case 'hall':
          await handleHall(message, args);
          break;
        case 'botset':
          await handleBotSet(message, args);
          break;
        case 'hc':
          await handleHC(message, args);
          break;
        case 'memory':
          await handleMemory(message, args);
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

  // Hall of Fame - Star Reaction Handler
  botClient.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    // Fetch partial reactions
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error('Error fetching reaction:', error);
        return;
      }
    }

    // Check if it's a star reaction
    if (reaction.emoji.name === '⭐') {
      await handleStarReaction(reaction);
    }
  });

  botClient.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error('Error fetching reaction:', error);
        return;
      }
    }

    if (reaction.emoji.name === '⭐') {
      await handleStarReaction(reaction);
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

  // Get user by Discord ID first
  const [user] = await db.select()
    .from(users)
    .where(eq(users.discordUserId, message.author.id));

  if (!user) {
    await message.reply('❌ **Discord account not linked to Murder.**\n\n' +
      '**To link your account:**\n' +
      '1. Use `!connect <username> <password>` in Discord, OR\n' +
      '2. Visit murder.tech to create/manage your account');
    return;
  }

  if (args.length > 0) {
    // Profile for a specific character by name (search server's characters)
    const characterName = args.join(' ');
    const normalizedInput = normalizeString(characterName);
    const guildId = message.guild?.id || '';

    // Get all characters that are mapped to this server
    const serverCharacters = await db
      .select({
        character: characterSheets
      })
      .from(channelCharacterMappings)
      .innerJoin(characterSheets, eq(channelCharacterMappings.characterId, characterSheets.id))
      .where(eq(channelCharacterMappings.guildId, guildId));

    // Also include the requesting user's unmapped characters
    const userCharacters = await db
      .select()
      .from(characterSheets)
      .where(eq(characterSheets.userId, user.id));

    // Combine and deduplicate
    const allAvailableCharacters = [
      ...serverCharacters.map(sc => sc.character),
      ...userCharacters
    ].filter((char, index, self) =>
      index === self.findIndex(c => c.id === char.id)
    );

    const matchedCharacters = allAvailableCharacters.filter(char =>
      normalizeString(char.name) === normalizedInput
    );

    if (matchedCharacters.length === 0) {
      await message.reply(`❌ Character "${characterName}" not found in this server or your account.`);
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

  // Helper to truncate text
  const truncate = (text: string, maxLength: number = 1024): string => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  // Helper to strip HTML tags
  const stripHtml = (text: string): string => {
    if (!text) return text;
    return text.replaceAll(/<[^>]*>/g, '').trim();
  };

  // Helper to parse race field
  const getRaceName = (race: any): string => {
    if (!race) return '';
    if (typeof race === 'string') {
      try {
        const parsed = JSON.parse(race);
        return parsed.name || parsed.race || race;
      } catch {
        return race;
      }
    }
    return race.name || race.race || '';
  };

  // Function to build embed for each tab
  const buildEmbed = async (tab: string): Promise<EmbedBuilder> => {
    const embed = new EmbedBuilder()
      .setTitle(`${character.name}`)
      .setColor('#6366f1');

    if (character.avatarUrl) {
      // Convert relative URL to absolute URL for Discord
      const avatarUrl = character.avatarUrl.startsWith('http')
        ? character.avatarUrl
        : `https://murder.tech${character.avatarUrl}`;
      embed.setThumbnail(avatarUrl);
    }

    switch (tab) {
      case 'identity':
        const identityInfo = [];
        if (character.fullName && character.fullName !== character.name) identityInfo.push(`**Full Name:** ${stripHtml(character.fullName)}`);
        if (character.titles) identityInfo.push(`**Titles:** ${stripHtml(character.titles)}`);
        if (character.species) identityInfo.push(`**Species:** ${stripHtml(character.species)}`);
        if (character.race) {
          const raceName = getRaceName(character.race);
          if (raceName) identityInfo.push(`**Race:** ${raceName}`);
        }
        if (character.ageDescription) identityInfo.push(`**Age:** ${stripHtml(character.ageDescription)}`);
        if (character.culturalBackground) identityInfo.push(`**Culture:** ${stripHtml(character.culturalBackground)}`);
        if (character.pronouns) identityInfo.push(`**Pronouns:** ${stripHtml(character.pronouns)}`);
        if (character.genderIdentity) identityInfo.push(`**Gender:** ${stripHtml(character.genderIdentity)}`);
        if (character.sexuality) identityInfo.push(`**Sexuality:** ${stripHtml(character.sexuality)}`);
        if (character.occupation) identityInfo.push(`**Occupation:** ${stripHtml(character.occupation)}`);
        if (character.currentLocation) identityInfo.push(`**Location:** ${stripHtml(character.currentLocation)}`);
        if (character.characterClass) identityInfo.push(`**Class:** ${character.characterClass}`);
        if (character.level) identityInfo.push(`**Level:** ${character.level}`);
        if (identityInfo.length > 0) {
          embed.addFields({ name: '👤 Basic Identity', value: truncate(identityInfo.join('\n')), inline: false });
        }
        break;

      case 'combat':
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
        embed.addFields({ name: '⚔️ Combat Stats', value: combatInfo.join(' • '), inline: false });

        // Saves
        const savesInfo = [
          `**Fortitude:** ${(character.fortitudeSave || 0) >= 0 ? '+' : ''}${character.fortitudeSave || 0}`,
          `**Reflex:** ${(character.reflexSave || 0) >= 0 ? '+' : ''}${character.reflexSave || 0}`,
          `**Will:** ${(character.willSave || 0) >= 0 ? '+' : ''}${character.willSave || 0}`
        ];
        embed.addFields({ name: '🛡️ Saving Throws', value: savesInfo.join(' • '), inline: false });
        break;

      case 'goals':
        const goalsInfo = [];
        if (character.currentGoal) goalsInfo.push(`**Current Goal:** ${stripHtml(character.currentGoal)}`);
        if (character.longTermDesire) goalsInfo.push(`**Long-term Desire:** ${stripHtml(character.longTermDesire)}`);
        if (character.coreMotivation) goalsInfo.push(`**Core Motivation:** ${stripHtml(character.coreMotivation)}`);
        if (character.deepestFear) goalsInfo.push(`**Deepest Fear:** ${stripHtml(character.deepestFear)}`);
        if (character.alignmentTendency) goalsInfo.push(`**Alignment:** ${stripHtml(character.alignmentTendency)}`);
        if (goalsInfo.length > 0) {
          embed.addFields({ name: '🎯 Goals & Motivations', value: truncate(goalsInfo.join('\n')), inline: false });
        }
        break;

      case 'personality':
        if (character.personalityOneSentence) {
          embed.addFields({ name: '💬 In a Nutshell', value: `*"${stripHtml(character.personalityOneSentence)}"*`, inline: false });
        }

        const personalityInfo = [];
        if (character.keyVirtues) personalityInfo.push(`**Virtues:** ${stripHtml(character.keyVirtues)}`);
        if (character.keyFlaws) personalityInfo.push(`**Flaws:** ${stripHtml(character.keyFlaws)}`);
        if (character.stressBehavior) personalityInfo.push(`**Under Stress:** ${stripHtml(character.stressBehavior)}`);
        if (character.habitsOrTells) personalityInfo.push(`**Habits:** ${stripHtml(character.habitsOrTells)}`);
        if (character.speechStyle) personalityInfo.push(`**Speech:** ${stripHtml(character.speechStyle)}`);
        if (personalityInfo.length > 0) {
          embed.addFields({ name: '😊 Personality Traits', value: truncate(personalityInfo.join('\n')), inline: false });
        }
        break;

      case 'appearance':
        const appearanceInfo = [];
        if (character.physicalPresence) appearanceInfo.push(`**Presence:** ${stripHtml(character.physicalPresence)}`);
        if (character.identifyingTraits) appearanceInfo.push(`**Identifying Traits:** ${stripHtml(character.identifyingTraits)}`);
        if (character.clothingAesthetic) appearanceInfo.push(`**Clothing Style:** ${stripHtml(character.clothingAesthetic)}`);
        if (appearanceInfo.length > 0) {
          embed.addFields({ name: '🎨 Appearance', value: truncate(appearanceInfo.join('\n')), inline: false });
        }
        break;

      case 'skills':
        const skillsInfo = [];
        if (character.notableEquipment) skillsInfo.push(`**Equipment:** ${stripHtml(character.notableEquipment)}`);
        if (character.skillsReliedOn) skillsInfo.push(`**Strengths:** ${stripHtml(character.skillsReliedOn)}`);
        if (character.skillsAvoided) skillsInfo.push(`**Weaknesses:** ${stripHtml(character.skillsAvoided)}`);
        if (skillsInfo.length > 0) {
          embed.addFields({ name: '⚔️ Skills & Abilities', value: truncate(skillsInfo.join('\n')), inline: false });
        }

        // Parse and display Pathfinder skills
        let skills = character.skills as any;
        if (typeof skills === 'string') {
          try {
            skills = JSON.parse(skills);
          } catch (e) {}
        }
        if (skills && typeof skills === 'object') {
          const trainedSkills = Object.entries(skills)
            .filter(([_, data]: any) => data.ranks > 0 || data.total >= 5)
            .map(([name, data]: any) => `**${name}:** +${data.total}`)
            .join('\n');
          if (trainedSkills) {
            embed.addFields({ name: '📚 Trained Skills', value: truncate(trainedSkills, 1024), inline: false });
          }
        }
        break;

      case 'backstory':
        if (character.origin) {
          embed.addFields({ name: '📖 Origin', value: truncate(stripHtml(character.origin), 1024), inline: false });
        }

        const backstoryNotes = [];
        if (character.greatestSuccess) backstoryNotes.push(`**Greatest Success:** ${stripHtml(character.greatestSuccess)}`);
        if (character.greatestFailure) backstoryNotes.push(`**Greatest Failure:** ${stripHtml(character.greatestFailure)}`);
        if (character.regret) backstoryNotes.push(`**Regret:** ${stripHtml(character.regret)}`);
        if (backstoryNotes.length > 0) {
          embed.addFields({ name: '🏆 Defining Moments', value: truncate(backstoryNotes.join('\n\n')), inline: false });
        }
        break;

      case 'relationships':
        // Portal relationships
        if (character.importantRelationships) {
          embed.addFields({ name: '👥 Important Relationships', value: truncate(stripHtml(character.importantRelationships), 1024), inline: false });
        }

        const relationshipNotes = [];
        if (character.protectedRelationship) relationshipNotes.push(`**Would Die For:** ${stripHtml(character.protectedRelationship)}`);
        if (character.rival) relationshipNotes.push(`**Rival:** ${stripHtml(character.rival)}`);
        if (character.affiliatedGroups) relationshipNotes.push(`**Groups:** ${stripHtml(character.affiliatedGroups)}`);
        if (relationshipNotes.length > 0) {
          embed.addFields({ name: '🤝 Key Connections', value: truncate(relationshipNotes.join('\n')), inline: false });
        }

        // Tracked relationships
        const trackedRels = await db.query.relationships.findMany({
          where: (rels, { eq, or }) =>
            or(
              eq(rels.character1Id, character.id),
              eq(rels.character2Id, character.id)
            ),
          with: {
            character1: true,
            character2: true
          }
        });

        if (trackedRels.length > 0) {
          const relStrings = trackedRels.map(rel => {
            const isChar1 = rel.character1Id === character.id;
            const otherChar = isChar1 ? rel.character2 : rel.character1;
            const descriptor = rel.relationshipType || 'connection';
            const notes = rel.notes ? ` | ${rel.notes}` : '';
            return `- ${descriptor} of **${otherChar.name}**${notes}`;
          });
          embed.addFields({ name: '💫 Tracked Relationships', value: truncate(relStrings.join('\n'), 1024), inline: false });
        }
        break;

      case 'beliefs':
        if (character.beliefsPhilosophy) {
          embed.addFields({ name: '🧠 Beliefs & Philosophy', value: truncate(stripHtml(character.beliefsPhilosophy), 1024), inline: false });
        }
        if (character.coreBelief) {
          embed.addFields({ name: '💭 Core Belief', value: truncate(stripHtml(character.coreBelief), 1024), inline: false });
        }
        break;

      case 'public_private':
        const secretsInfo = [];
        if (character.publicFacade) secretsInfo.push(`**Public Face:** ${stripHtml(character.publicFacade)}`);
        if (character.hiddenAspect) secretsInfo.push(`**Hidden Aspect:** ${stripHtml(character.hiddenAspect)}`);
        if (character.secret) secretsInfo.push(`**Secret:** ${stripHtml(character.secret)}`);
        if (secretsInfo.length > 0) {
          embed.addFields({ name: '👁️ Public vs Private Self', value: truncate(secretsInfo.join('\n\n')), inline: false });
        }
        break;

      case 'growth':
        const arcInfo = [];
        if (character.recentChange) arcInfo.push(`**Recent Change:** ${stripHtml(character.recentChange)}`);
        if (character.potentialChange) arcInfo.push(`**Potential Growth:** ${stripHtml(character.potentialChange)}`);
        if (arcInfo.length > 0) {
          embed.addFields({ name: '📈 Growth & Change', value: truncate(arcInfo.join('\n\n')), inline: false });
        }
        break;

      case 'legacy':
        const legacyInfo = [];
        if (character.symbolOrMotif) legacyInfo.push(`**Symbol:** ${stripHtml(character.symbolOrMotif)}`);
        if (character.legacy) legacyInfo.push(`**Legacy:** ${stripHtml(character.legacy)}`);
        if (character.rememberedAs) legacyInfo.push(`**Remembered As:** ${stripHtml(character.rememberedAs)}`);
        if (legacyInfo.length > 0) {
          embed.addFields({ name: '🌟 Legacy & Symbol', value: truncate(legacyInfo.join('\n\n')), inline: false });
        }
        break;
    }

    embed.setFooter({ text: `Use !roll <stat> to roll for ${character.name}` });
    return embed;
  };

  // Create button rows for tabs (Discord allows 5 buttons per row)
  const createButtons1 = (currentTab: string) => {
    return new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('tab_identity')
          .setLabel('Identity')
          .setStyle(currentTab === 'identity' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji('👤'),
        new ButtonBuilder()
          .setCustomId('tab_combat')
          .setLabel('Combat')
          .setStyle(currentTab === 'combat' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji('⚔️'),
        new ButtonBuilder()
          .setCustomId('tab_goals')
          .setLabel('Goals')
          .setStyle(currentTab === 'goals' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji('🎯'),
        new ButtonBuilder()
          .setCustomId('tab_personality')
          .setLabel('Personality')
          .setStyle(currentTab === 'personality' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji('😊'),
        new ButtonBuilder()
          .setCustomId('tab_appearance')
          .setLabel('Appearance')
          .setStyle(currentTab === 'appearance' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji('🎨')
      );
  };

  const createButtons2 = (currentTab: string) => {
    return new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('tab_skills')
          .setLabel('Skills')
          .setStyle(currentTab === 'skills' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji('📚'),
        new ButtonBuilder()
          .setCustomId('tab_backstory')
          .setLabel('Backstory')
          .setStyle(currentTab === 'backstory' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji('📖'),
        new ButtonBuilder()
          .setCustomId('tab_relationships')
          .setLabel('Relationships')
          .setStyle(currentTab === 'relationships' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji('👥'),
        new ButtonBuilder()
          .setCustomId('tab_beliefs')
          .setLabel('Beliefs')
          .setStyle(currentTab === 'beliefs' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji('🧠'),
        new ButtonBuilder()
          .setCustomId('tab_public_private')
          .setLabel('Public/Private')
          .setStyle(currentTab === 'public_private' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji('👁️')
      );
  };

  const createButtons3 = (currentTab: string) => {
    return new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('tab_growth')
          .setLabel('Growth')
          .setStyle(currentTab === 'growth' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji('📈'),
        new ButtonBuilder()
          .setCustomId('tab_legacy')
          .setLabel('Legacy')
          .setStyle(currentTab === 'legacy' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji('🌟')
      );
  };

  // Send initial message
  let currentTab = 'identity';
  const reply = await message.reply({
    embeds: [await buildEmbed(currentTab)],
    components: [createButtons1(currentTab), createButtons2(currentTab), createButtons3(currentTab)]
  });

  // Create collector for button interactions
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 300000 // 5 minutes
  });

  collector.on('collect', async (interaction) => {
    if (interaction.user.id !== message.author.id) {
      await interaction.reply({ content: '❌ Only the person who ran !profile can navigate tabs.', ephemeral: true });
      return;
    }

    const tabMatch = interaction.customId.match(/^tab_(.+)$/);
    if (tabMatch) {
      currentTab = tabMatch[1];
      await interaction.update({
        embeds: [await buildEmbed(currentTab)],
        components: [createButtons1(currentTab), createButtons2(currentTab), createButtons3(currentTab)]
      });
    }
  });

  collector.on('end', () => {
    // Disable buttons after timeout
    reply.edit({ components: [] }).catch(() => {});
  });
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
    let skills = character.skills as any;

    // Parse skills if they're stored as a JSON string
    if (typeof skills === 'string') {
      try {
        skills = JSON.parse(skills);
      } catch (e) {
        console.error(`[handleRoll] Failed to parse skills for ${character.name}:`, e);
        await message.reply(`❌ ${character.name} has malformed skills data. Please re-sync from PathCompanion.`);
        return;
      }
    }

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

  // Determine embed color based on roll
  let embedColor = 0x0099ff; // Default blue
  if (diceRoll === 20) embedColor = 0x00ff00; // Green for nat 20
  else if (diceRoll === 1) embedColor = 0xff0000; // Red for nat 1

  // Create embed
  const embed = new EmbedBuilder()
    .setColor(embedColor)
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
const ENCRYPTION_KEY = process.env.PATHCOMPANION_ENCRYPTION_KEY || node_crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';

function encryptPassword(password: string): string {
  const iv = node_crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
  const cipher = node_crypto.createCipheriv(ALGORITHM, key, iv);
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
  const decipher = node_crypto.createDecipheriv(ALGORITHM, key, iv);
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
      '🔗 **Linking your Discord account** to Murder will allow you to:\n' +
      '• Use all your Murder characters in Discord\n' +
      '• Roll dice with your character stats\n' +
      '• Proxy messages as your characters\n\n' +
      '💡 Don\'t have a Murder account? Create one at https://murder.tech');
    return;
  }

  const username = args[0];
  const password = args.slice(1).join(' '); // Allow passwords with spaces

  try {
    // Send a DM to the user for privacy
    await message.author.send('🔐 Connecting to Murder...');

    // Authenticate with Murder backend
    const API_URL = process.env.API_URL || 'http://localhost:3000';
    const response = await axios.post(`${API_URL}/api/discord/login`, {
      username,
      password,
      discordUserId: message.author.id
    });

    const { user, characters } = response.data;

    await message.author.send('✅ **Successfully connected to Murder!**\n\n' +
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

    console.log(`Discord account ${message.author.tag} (${message.author.id}) linked to Murder user: ${username}`);

  } catch (error: any) {
    console.error('Discord Murder connect error:', error);

    let errorMsg = 'Unknown error occurred';
    if (error.response?.data?.error) {
      errorMsg = error.response.data.error;
    } else if (error.message) {
      errorMsg = error.message;
    }

    await message.author.send('❌ **Failed to connect to Murder.**\n\n' +
      `Error: ${errorMsg}\n\n` +
      'Please check your username and password and try again.\n\n' +
      '💡 Need help? Visit https://murder.tech to manage your account.');
  }
}

async function handleSyncAll(message: Message) {
  await message.reply('🔄 Refreshing your character list from Murder...');

  try {
    // Get user by Discord ID
    const [user] = await db.select()
      .from(users)
      .where(eq(users.discordUserId, message.author.id));

    if (!user) {
      await message.reply('❌ **Discord account not linked to Murder.**\n\n' +
        '**To link your account:**\n' +
        '1. Use `!connect <username> <password>` in Discord, OR\n' +
        '2. Visit murder.tech to create/manage your account\n\n' +
        '💡 Once linked, all your Murder characters will be available!');
      return;
    }

    // Get all characters for this user
    const characters = await db.select()
      .from(characterSheets)
      .where(eq(characterSheets.userId, user.id));

    if (characters.length === 0) {
      await message.reply('ℹ️ **No characters found in your Murder account.**\n\n' +
        '**Create characters:**\n' +
        '• Visit https://murder.tech and create a character manually\n' +
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
    .setColor(0x9b59b6)
    .setTitle('🎭 Cyar\'ika Bot Commands')
    .setDescription('Your complete RP companion!')
    .addFields(
      { name: '🔗 Account Setup', value: '`!connect <username> <password>` - Link Discord account\n`!syncall` - Refresh character list', inline: false },
      { name: '🎭 Characters', value: '`!CharName <stat>` - Roll for any character\n`CharName: message` - Speak as character\n`!setchar <name>` - Link character to channel\n`!profile [name]` - View character profile', inline: false },
      { name: '🎲 Dice & Stats', value: '`!roll <dice>` - Roll dice (e.g., !roll 1d20+5)\n`!stats [character]` - View character stats\n`!leaderboard <type>` - View leaderboards\n  Types: messages, rolls, crits, fails', inline: false },
      { name: '💭 AI & Knowledge', value: '`!ask <question>` - Ask the AI anything\n`!feat <name>` - D&D feat details\n`!spell <name>` - Spell information\n`!learn <question> | <answer> [| category]` - Teach AI (admin)\n`!learnurl <url> [category]` - Scrape webpage into knowledge base (wrap URL in <>)', inline: false },
      { name: '🎬 RP Tools', value: '`!prompt [random <category>]` - Get RP prompt\n`!trope [category]` - Random trope inspiration\n`!session <start|end|pause|resume|list>` - Track sessions\n`!scene <start|end|tag|location|list>` - Manage scenes', inline: false },
      { name: '⭐ Hall of Fame', value: 'React with ⭐ to messages (10+ stars → Hall of Fame!)\n`!hall` - Recent Hall of Fame\n`!hall top` - Top 20 starred messages', inline: false },
      { name: '� Character Memories', value: '`!Memory <Character> | <memory>` - Add memory\n`!<Character> Memories` - View all memories\nExample: `!Memory Ogun | Had a dream`', inline: false },
      { name: '�🛠️ Utilities', value: '`!time [set <date>]` - Game time tracking\n`!note <add|list>` - GM notes\n`!hc <text|list|edit|delete>` - HC list\n`!npc <name>` - Generate quick NPC\n`!music` - Mood music suggestion\n`!recap` - Session recap', inline: false },
      { name: '⚙️ Admin', value: '`!botset` - Set bot announcement channel (admin)', inline: false }
    )
    .setFooter({ text: 'Visit murder.tech to manage characters!' });

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
      webhook = webhooks.find(wh => wh.owner?.id === botClient?.user?.id && wh.name === 'Murder Proxy');

      if (!webhook) {
        // Create new webhook
        webhook = await channel.createWebhook({
          name: 'Murder Proxy',
          reason: 'Character proxying for Murder Tech Portal'
        });
      }

      webhookCache.set(channel.id, webhook);
    }

    // Delete the original message
    await message.delete().catch(() => {});

    // Convert relative avatar URL to absolute URL
    let avatarUrl = character.avatarUrl;

    if (avatarUrl && avatarUrl.startsWith('/')) {
      // Relative URL, make it absolute
      const baseUrl = process.env.FRONTEND_URL || 'http://54.242.214.56';
      avatarUrl = baseUrl + avatarUrl;
    } else if (!avatarUrl) {
      // No avatar, use default
      avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(character.name) + '&size=256&background=random';
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
        webhook = webhooks.find(wh => wh.owner?.id === botClient?.user?.id && wh.name === 'Murder Proxy');

        if (!webhook) {
          webhook = await channel.createWebhook({
            name: 'Murder Proxy',
            reason: 'Character proxying for Murder Tech Portal'
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
      let skills = character.skills as any;

      // Parse skills if they're stored as a JSON string
      if (typeof skills === 'string') {
        try {
          skills = JSON.parse(skills);
        } catch (e) {
          console.error(`[handleNameRoll] Failed to parse skills for ${character.name}:`, e);
          await message.reply(`❌ ${character.name} has malformed skills data. Please re-sync from PathCompanion.`);
          return true;
        }
      }

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

    // Determine embed color
    let embedColor = 0x0099ff;
    if (diceRoll === 20) embedColor = 0x00ff00;
    else if (diceRoll === 1) embedColor = 0xff0000;

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(embedColor)
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
        // Determine embed color
        let embedColor = 0x0099ff;
        if (rollData.diceRoll === 20) embedColor = 0x00ff00;
        else if (rollData.diceRoll === 1) embedColor = 0xff0000;

        const embed = new EmbedBuilder()
          .setColor(embedColor)
          .setTitle(`🎲 ${character.name} - ${rollData.rollDescription}`)
          .setDescription(`**${rollData.diceRoll}** ${rollData.modifier >= 0 ? '+' : ''}${rollData.modifier} = **${rollData.total}**`)
          .setFooter({ text: 'Rolled from Murder Tech Portal' })
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

async function handleRelationship(message: Message, content: string) {
  try {
    // Parse: !Character1 is Character2's descriptor | notes
    const match = content.match(/^!([\p{L}\p{N}\s]+)\s+is\s+([\p{L}\p{N}\s]+)'s\s+(.+?)(?:\s*\|\s*(.+))?$/ui);

    if (!match) {
      await message.reply('❌ Invalid relationship format. Use: `!Character1 is Character2\'s descriptor | notes`\nExample: `!Ogun is Rig\'s best friend | They admire each other.`');
      return;
    }

    const char1Name = match[1].trim();
    const char2Name = match[2].trim();
    const descriptor = match[3].trim();
    const notes = match[4]?.trim() || '';

    // Find both characters
    const char1 = await db.query.characterSheets.findFirst({
      where: (chars, { eq, sql }) =>
        sql`LOWER(${chars.name}) = ${char1Name.toLowerCase()}`
    });

    const char2 = await db.query.characterSheets.findFirst({
      where: (chars, { eq, sql }) =>
        sql`LOWER(${chars.name}) = ${char2Name.toLowerCase()}`
    });

    if (!char1) {
      await message.reply(`❌ Character "${char1Name}" not found.`);
      return;
    }

    if (!char2) {
      await message.reply(`❌ Character "${char2Name}" not found.`);
      return;
    }

    // Check if relationship already exists
    const existing = await db.query.relationships.findFirst({
      where: (rels, { and, eq, or }) =>
        and(
          or(
            and(eq(rels.character1Id, char1.id), eq(rels.character2Id, char2.id)),
            and(eq(rels.character1Id, char2.id), eq(rels.character2Id, char1.id))
          )
        )
    });

    if (existing) {
      // Update existing relationship
      await db.update(relationships)
        .set({
          relationshipType: descriptor,
          notes: notes,
          updatedAt: new Date()
        })
        .where(eq(relationships.id, existing.id));

      await message.reply(`✅ Updated relationship: **${char1.name}** is ${char2.name}'s **${descriptor}**${notes ? ` | ${notes}` : ''}`);
    } else {
      // Create new relationship
      await db.insert(relationships).values({
        character1Id: char1.id,
        character2Id: char2.id,
        relationshipType: descriptor,
        notes: notes
      });

      await message.reply(`✅ Added relationship: **${char1.name}** is ${char2.name}'s **${descriptor}**${notes ? ` | ${notes}` : ''}`);
    }
  } catch (error) {
    console.error('Error handling relationship command:', error);
    await message.reply('❌ Failed to save relationship.');
  }
}

async function handleAsk(message: Message, args: string[]) {
  if (args.length === 0) {
    await message.reply('Usage: `!ask <question>`\nExample: `!ask How does sneak attack work?`');
    return;
  }

  const question = args.join(' ');
  const guildId = message.guild?.id;

  if (!guildId) {
    await message.reply('❌ This command can only be used in a server, not in DMs.');
    return;
  }

  try {
    // First, search THIS server's knowledge base
    const searchResults = await db.select()
      .from(knowledgeBase)
      .where(and(
        eq(knowledgeBase.guildId, guildId),
        sql`LOWER(${knowledgeBase.question}) LIKE LOWER(${'%' + question + '%'})`
      ))
      .limit(1);

    if (searchResults.length > 0) {
      const kb = searchResults[0];

      // Truncate if too long for Discord embed
      const truncatedAnswer = kb.answer.length > 4000
        ? kb.answer.substring(0, 3997) + '...'
        : kb.answer;

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('📚 Knowledge Base')
        .setDescription(truncatedAnswer)
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

    // Truncate if too long for Discord embed (max 4096 chars)
    const truncatedAnswer = answer.length > 4000
      ? answer.substring(0, 3997) + '...'
      : answer;

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('🤖 AI Answer')
      .setDescription(truncatedAnswer)
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
          guildId,
          question,
          answer,
          aiGenerated: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await message.reply('✅ Saved to this server\'s knowledge base!');
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

  const guildId = message.guild?.id;
  if (!guildId) {
    await message.reply('❌ This command can only be used in a server, not in DMs.');
    return;
  }

  const fullText = args.join(' ');
  const parts = fullText.split('|').map(p => p.trim());

  if (parts.length < 2 || parts.length > 3) {
    await message.reply(
      'Usage: `!learn <question> | <answer> [| <category>]`\n' +
      'Example: `!learn What is AC? | Armor Class is your defense rating`\n' +
      'With category: `!learn Fireball | 3rd-level evocation spell... | spell`\n' +
      'Categories: `kink`, `feat`, `spell`, or leave blank for general'
    );
    return;
  }

  const [question, answer, category] = parts;

  try {
    await db.insert(knowledgeBase).values({
      guildId,
      question,
      answer,
      category: category || null,
      aiGenerated: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const categoryTag = category ? ` [${category.toUpperCase()}]` : '';
    await message.reply(`✅ Added to this server's knowledge base!${categoryTag}\n**Q:** ${question}\n**A:** ${answer.substring(0, 200)}${answer.length > 200 ? '...' : ''}`);
  } catch (error) {
    console.error('Error in !learn command:', error);
    await message.reply('❌ Failed to add to knowledge base.');
  }
}

async function handleLearnUrl(message: Message, args: string[]) {
  // Check if user has admin permissions
  if (!message.member?.permissions.has('Administrator')) {
    await message.reply('❌ Only administrators can use this command.');
    return;
  }

  const guildId = message.guild?.id;
  if (!guildId) {
    await message.reply('❌ This command can only be used in a server, not in DMs.');
    return;
  }

  if (args.length === 0) {
    await message.reply(
      'Usage: `!learnurl <url> [category]`\n' +
      'Example: `!learnurl <https://www.d20pfsrd.com/feats/combat-feats/power-attack-combat/> feat`\n' +
      'Supported sites: d20pfsrd.com and most standard web pages\n' +
      'Categories: `kink`, `feat`, `spell`, or leave blank for general'
    );
    return;
  }

  // Discord suppresses auto-linking with <URL>, so strip the angle brackets
  let url = args[0];
  if (url && url.startsWith('<') && url.endsWith('>')) {
    url = url.slice(1, -1);
  }

  const category = args[1] || null;

  // Validate URL
  try {
    new URL(url);
  } catch {
    await message.reply('❌ Invalid URL. Please provide a valid URL.');
    return;
  }

  await message.reply(`⏳ Learning from ${url}... This may take a few moments.`);

  try {
    const entries = await learnFromUrl(url);

    if (entries.length === 0) {
      await message.reply('❌ Could not extract any information from that URL. The site may be blocking scraping, the page structure is not supported, or there was a connection error. Check the server logs for details.');
      return;
    }

    // Insert all entries into knowledge base
    let successCount = 0;
    for (const entry of entries) {
      try {
        await db.insert(knowledgeBase).values({
          guildId,
          question: entry.question,
          answer: entry.answer,
          category: category,
          aiGenerated: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        successCount++;
      } catch (error) {
        console.error('Error inserting entry:', error);
      }
    }

    const categoryTag = category ? ` to category [${category.toUpperCase()}]` : '';
    await message.reply(`✅ Added **${successCount}** entries${categoryTag} to this server's knowledge base from ${url}!\nTry asking me about it with \`!ask\``);
  } catch (error) {
    console.error('Error in !learnurl command:', error);
    await message.reply('❌ Failed to learn from that URL. The site may be blocking scraping or the page structure is not supported.');
  }
}

// Generic knowledge lookup function with AI fallback
async function handleKnowledgeLookup(message: Message, args: string[], category: string, emoji: string, categoryName: string, gameSystem?: string) {
  if (args.length === 0) {
    await message.reply(`Usage: \`!${category} <name>\`\nExample: \`!${category} ${category === 'kink' ? 'bondage' : category === 'feat' ? 'Power Attack' : 'Fireball'}\``);
    return;
  }

  const searchTerm = args.join(' ');

  try {
    // First, search knowledge base for this category
    const searchResults = await db.select()
      .from(knowledgeBase)
      .where(and(
        eq(knowledgeBase.category, category),
        sql`LOWER(${knowledgeBase.question}) LIKE LOWER(${'%' + searchTerm + '%'})`
      ))
      .limit(1);

    if (searchResults.length > 0) {
      const kb = searchResults[0];

      // Truncate if too long for Discord embed
      const truncatedAnswer = kb.answer.length > 4000
        ? kb.answer.substring(0, 3997) + '...'
        : kb.answer;

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`${emoji} ${kb.question}`)
        .setDescription(truncatedAnswer)
        .addFields(
          { name: 'Category', value: categoryName, inline: true },
          { name: 'Source', value: kb.aiGenerated ? '🤖 AI Generated' : (kb.sourceUrl || 'Manual Entry'), inline: true }
        )
        .setFooter({ text: `👍 ${kb.upvotes || 0} upvotes` })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      return;
    }

    // If not in KB, try Wikipedia (with search fallback)
    if ('sendTyping' in message.channel) {
      await message.channel.sendTyping();
    }

    try {
      let wikiPage: any = null;
      let wikiSummary: any = null;

      try {
        // Try exact match first
        wikiPage = await wiki.page(searchTerm);
        wikiSummary = await wikiPage.summary();
      } catch (exactError) {
        // If exact match fails, try search
        const searchResults = await wiki.search(searchTerm);
        if (searchResults.results.length > 0) {
          // Use the first search result
          wikiPage = await wiki.page(searchResults.results[0].title);
          wikiSummary = await wikiPage.summary();
        }
      }

      if (wikiPage && wikiSummary && wikiSummary.extract && wikiSummary.extract.length > 50) {
        // Truncate if too long for Discord embed
        const truncatedSummary = wikiSummary.extract.length > 4000
          ? wikiSummary.extract.substring(0, 3997) + '...'
          : wikiSummary.extract;

        const embed = new EmbedBuilder()
          .setColor(0xf39c12)
          .setTitle(`${emoji} ${wikiSummary.title}`)
          .setDescription(truncatedSummary)
          .addFields(
            { name: 'Category', value: categoryName, inline: true },
            { name: 'Source', value: '📚 Wikipedia', inline: true }
          )
          .setFooter({ text: `React ⭐ to save this to knowledge base • ${wikiPage.canonicalurl}` })
          .setTimestamp();

        if (wikiSummary.thumbnail?.source) {
          embed.setThumbnail(wikiSummary.thumbnail.source);
        }

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
            const guildId = message.guild?.id || 'dm';
            await db.insert(knowledgeBase).values({
              guildId,
              question: searchTerm,
              answer: wikiSummary.extract,
              category,
              sourceUrl: wikiPage.canonicalurl,
              aiGenerated: false,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            await message.reply('✅ Saved Wikipedia article to this server\'s knowledge base!');
          } catch (error) {
            console.error('Error saving to knowledge base:', error);
          }
        });

        return;
      }
    } catch (wikiError) {
      // Wikipedia didn't find anything, use AI
      console.log(`Wikipedia search failed for "${searchTerm}", using AI...`);
    }

    // If not in Wikipedia, ask AI as fallback
    if ('sendTyping' in message.channel) {
      await message.channel.sendTyping();
    }

    // Add game system context if specified
    const systemContext = gameSystem ? ` from ${gameSystem}` : '';

    // Adjust prompt based on category
    let aiQuestion = '';
    if (category === 'kink') {
      aiQuestion = `Provide a concise, educational definition of "${searchTerm}" in the context of BDSM and kink practices. Include: 1) Clear definition (2-3 sentences), 2) Common practices or variations, 3) Safety/consent considerations if relevant. Keep response under 300 words. Be factual, respectful, and informative. Do NOT talk about D&D, Pathfinder, or tabletop games.`;
    } else if (category === 'spell') {
      aiQuestion = `Provide detailed information about the spell "${searchTerm}" from Pathfinder or D&D. Include: spell level, school, casting time, components, duration, and description of effects. Be specific and comprehensive. Only use information from Pathfinder or D&D game systems.`;
    } else if (category === 'feat') {
      aiQuestion = `Provide detailed information about the feat "${searchTerm}" from Pathfinder. Include: prerequisites, benefits, and tactical uses. Only use information from Pathfinder. Do not include information from other game systems.`;
    } else {
      aiQuestion = `Provide detailed information about the ${categoryName.toLowerCase()} "${searchTerm}"${systemContext}. Be specific and comprehensive.${gameSystem ? ` Only use information from ${gameSystem}. Do not include information from other game systems.` : ''}`;
    }

    const answer = await GeminiService.askGemini(aiQuestion);

    // Truncate if too long for Discord embed (max 4096 chars)
    const truncatedAnswer = answer.length > 4000
      ? answer.substring(0, 3997) + '...'
      : answer;

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle(`${emoji} ${searchTerm}`)
      .setDescription(truncatedAnswer)
      .addFields({ name: 'Category', value: `${categoryName} (AI Generated)`, inline: true })
      .setFooter({ text: `React ⭐ to save this to knowledge base • Use !learn to add custom entries` })
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
        const guildId = message.guild?.id || 'dm';
        await db.insert(knowledgeBase).values({
          guildId,
          question: searchTerm,
          answer,
          category,
          aiGenerated: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await message.reply('✅ Saved to this server\'s knowledge base!');
      } catch (error) {
        console.error('Error saving to knowledge base:', error);
      }
    });

  } catch (error) {
    console.error(`Error in !${category} command:`, error);
    await message.reply(`❌ Sorry, I encountered an error looking up that ${categoryName.toLowerCase()}.`);
  }
}

async function handleFeat(message: Message, args: string[]) {
  await handleKnowledgeLookup(message, args, 'feat', '⚔️', 'Feat', 'Pathfinder');
}

async function handleSpell(message: Message, args: string[]) {
  await handleKnowledgeLookup(message, args, 'spell', '✨', 'Spell');
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

// ==================== RP PROMPTS ====================
async function handlePrompt(message: Message, args: string[]) {
  try {
    const subcmd = args[0]?.toLowerCase();

    if (subcmd === 'random' && args.length > 1) {
      // !prompt random <category>
      const category = args.slice(1).join(' ').toLowerCase();
      const validCategories = ['character', 'world', 'combat', 'social', 'plot'];

      if (!validCategories.includes(category)) {
        await message.reply(`❌ Invalid category. Valid categories: ${validCategories.join(', ')}`);
        return;
      }

      const categoryPrompts = await db
        .select()
        .from(prompts)
        .where(eq(prompts.category, category));

      if (categoryPrompts.length === 0) {
        await message.reply(`❌ No prompts found for category "${category}".`);
        return;
      }

      const randomPrompt = categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];

      // Update use count
      await db.update(prompts)
        .set({
          useCount: (randomPrompt.useCount || 0) + 1,
          lastUsed: new Date()
        })
        .where(eq(prompts.id, randomPrompt.id));

      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle(`💭 ${category.charAt(0).toUpperCase() + category.slice(1)} Prompt`)
        .setDescription(randomPrompt.promptText)
        .setFooter({ text: `Prompt #${randomPrompt.id}` });

      await message.reply({ embeds: [embed] });
    } else {
      // !prompt - Random from any category
      const allPrompts = await db.select().from(prompts);

      if (allPrompts.length === 0) {
        await message.reply('❌ No prompts available. Add some prompts to the database!');
        return;
      }

      const randomPrompt = allPrompts[Math.floor(Math.random() * allPrompts.length)];

      // Update use count
      await db.update(prompts)
        .set({
          useCount: (randomPrompt.useCount || 0) + 1,
          lastUsed: new Date()
        })
        .where(eq(prompts.id, randomPrompt.id));

      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle(`💭 ${randomPrompt.category.charAt(0).toUpperCase() + randomPrompt.category.slice(1)} Prompt`)
        .setDescription(randomPrompt.promptText)
        .setFooter({ text: `Prompt #${randomPrompt.id}` });

      await message.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Error in !prompt command:', error);
    await message.reply('❌ Failed to retrieve prompt.');
  }
}

async function handleTrope(message: Message, args: string[]) {
  try {
    const category = args.join(' ').toLowerCase();
    let tropeList = [];

    if (category && category !== '') {
      const validCategories = ['archetype', 'dynamic', 'situation', 'plot'];
      if (!validCategories.includes(category)) {
        await message.reply(`❌ Invalid category. Valid categories: ${validCategories.join(', ')}`);
        return;
      }

      tropeList = await db
        .select()
        .from(tropes)
        .where(eq(tropes.category, category));
    } else {
      tropeList = await db.select().from(tropes);
    }

    if (tropeList.length === 0) {
      await message.reply('❌ No tropes available.');
      return;
    }

    const randomTrope = tropeList[Math.floor(Math.random() * tropeList.length)];

    // Update use count
    await db.update(tropes)
      .set({ useCount: (randomTrope.useCount || 0) + 1 })
      .where(eq(tropes.id, randomTrope.id));

    const embed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle(`🎭 ${randomTrope.name}`)
      .setDescription(randomTrope.description)
      .setFooter({ text: `${randomTrope.category.charAt(0).toUpperCase() + randomTrope.category.slice(1)} Trope` });

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in !trope command:', error);
    await message.reply('❌ Failed to retrieve trope.');
  }
}

// ==================== SESSION LOGGING ====================
async function handleSession(message: Message, args: string[]) {
  try {
    const subcmd = args[0]?.toLowerCase();
    const channelId = message.channel.id;
    const guildId = message.guild?.id || '';

    switch (subcmd) {
      case 'start': {
        const title = args.slice(1).join(' ');
        if (!title) {
          await message.reply('Usage: `!session start <title>`');
          return;
        }

        // Check if session already running
        const existing = await db.select()
          .from(sessions)
          .where(and(
            eq(sessions.channelId, channelId),
            sql`${sessions.endedAt} IS NULL`
          ));

        if (existing.length > 0) {
          await message.reply('❌ A session is already running in this channel. Use `!session end` first.');
          return;
        }

        const [session] = await db.insert(sessions).values({
          title,
          channelId,
          guildId,
          participants: JSON.stringify([message.author.id]),
          startedAt: new Date()
        }).returning();

        await message.reply(`✅ Session **"${title}"** started! Messages will be logged.`);
        break;
      }

      case 'end': {
        const [session] = await db.select()
          .from(sessions)
          .where(and(
            eq(sessions.channelId, channelId),
            sql`${sessions.endedAt} IS NULL`
          ));

        if (!session) {
          await message.reply('❌ No active session in this channel.');
          return;
        }

        await db.update(sessions)
          .set({ endedAt: new Date() })
          .where(eq(sessions.id, session.id));

        const messageCount = await db.select({ count: sql<number>`count(*)` })
          .from(sessionMessages)
          .where(eq(sessionMessages.sessionId, session.id));

        await message.reply(`✅ Session **"${session.title}"** ended! Logged ${messageCount[0]?.count || 0} messages.`);
        break;
      }

      case 'pause': {
        const [session] = await db.select()
          .from(sessions)
          .where(and(
            eq(sessions.channelId, channelId),
            sql`${sessions.endedAt} IS NULL`
          ));

        if (!session) {
          await message.reply('❌ No active session in this channel.');
          return;
        }

        await db.update(sessions)
          .set({ isPaused: true, pausedAt: new Date() })
          .where(eq(sessions.id, session.id));

        await message.reply('⏸️ Session paused. Use `!session resume` to continue.');
        break;
      }

      case 'resume': {
        const [session] = await db.select()
          .from(sessions)
          .where(and(
            eq(sessions.channelId, channelId),
            sql`${sessions.endedAt} IS NULL`
          ));

        if (!session) {
          await message.reply('❌ No active session in this channel.');
          return;
        }

        await db.update(sessions)
          .set({ isPaused: false, pausedAt: null })
          .where(eq(sessions.id, session.id));

        await message.reply('▶️ Session resumed!');
        break;
      }

      case 'list': {
        const recentSessions = await db.select()
          .from(sessions)
          .where(eq(sessions.guildId, guildId))
          .orderBy(desc(sessions.startedAt))
          .limit(10);

        if (recentSessions.length === 0) {
          await message.reply('No sessions found for this server.');
          return;
        }

        const embed = new EmbedBuilder()
          .setColor('#3498db')
          .setTitle('📝 Recent Sessions')
          .setDescription(recentSessions.map((s, i) => {
            const status = s.endedAt ? '✅ Ended' : (s.isPaused ? '⏸️ Paused' : '▶️ Active');
            return `${i + 1}. **${s.title}** - ${status}\nStarted: ${s.startedAt.toLocaleDateString()}`;
          }).join('\n\n'));

        await message.reply({ embeds: [embed] });
        break;
      }

      default:
        await message.reply('Usage: `!session <start|end|pause|resume|list> [args]`');
    }
  } catch (error) {
    console.error('Error in !session command:', error);
    await message.reply('❌ Failed to handle session command.');
  }
}

// ==================== SCENE MANAGER ====================
async function handleScene(message: Message, args: string[]) {
  try {
    const subcmd = args[0]?.toLowerCase();
    const channelId = message.channel.id;
    const guildId = message.guild?.id || '';

    switch (subcmd) {
      case 'start': {
        const title = args.slice(1).join(' ');
        if (!title) {
          await message.reply('Usage: `!scene start <title>`');
          return;
        }

        // Check if scene already running
        const existing = await db.select()
          .from(scenes)
          .where(and(
            eq(scenes.channelId, channelId),
            sql`${scenes.endedAt} IS NULL`
          ));

        if (existing.length > 0) {
          await message.reply('❌ A scene is already active in this channel. Use `!scene end` first.');
          return;
        }

        const [scene] = await db.insert(scenes).values({
          title,
          channelId,
          guildId,
          participants: JSON.stringify([message.author.id]),
          startedAt: new Date()
        }).returning();

        await message.reply(`🎬 Scene **"${title}"** started!`);
        break;
      }

      case 'end': {
        const [scene] = await db.select()
          .from(scenes)
          .where(and(
            eq(scenes.channelId, channelId),
            sql`${scenes.endedAt} IS NULL`
          ));

        if (!scene) {
          await message.reply('❌ No active scene in this channel.');
          return;
        }

        await db.update(scenes)
          .set({ endedAt: new Date() })
          .where(eq(scenes.id, scene.id));

        await message.reply(`✅ Scene **"${scene.title}"** ended!`);
        break;
      }

      case 'tag': {
        const tags = args.slice(1).join(' ').split(',').map(t => t.trim());
        if (tags.length === 0) {
          await message.reply('Usage: `!scene tag <tag1, tag2, ...>`');
          return;
        }

        const [scene] = await db.select()
          .from(scenes)
          .where(and(
            eq(scenes.channelId, channelId),
            sql`${scenes.endedAt} IS NULL`
          ));

        if (!scene) {
          await message.reply('❌ No active scene in this channel.');
          return;
        }

        await db.update(scenes)
          .set({ tags: JSON.stringify(tags) })
          .where(eq(scenes.id, scene.id));

        await message.reply(`🏷️ Tags added: ${tags.join(', ')}`);
        break;
      }

      case 'location': {
        const location = args.slice(1).join(' ');
        if (!location) {
          await message.reply('Usage: `!scene location <location>`');
          return;
        }

        const [scene] = await db.select()
          .from(scenes)
          .where(and(
            eq(scenes.channelId, channelId),
            sql`${scenes.endedAt} IS NULL`
          ));

        if (!scene) {
          await message.reply('❌ No active scene in this channel.');
          return;
        }

        await db.update(scenes)
          .set({ location })
          .where(eq(scenes.id, scene.id));

        await message.reply(`📍 Location set: ${location}`);
        break;
      }

      case 'list': {
        const recentScenes = await db.select()
          .from(scenes)
          .where(eq(scenes.guildId, guildId))
          .orderBy(desc(scenes.startedAt))
          .limit(10);

        if (recentScenes.length === 0) {
          await message.reply('No scenes found for this server.');
          return;
        }

        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setTitle('🎬 Recent Scenes')
          .setDescription(recentScenes.map((s, i) => {
            const status = s.endedAt ? '✅' : '▶️';
            return `${status} ${i + 1}. **${s.title}**\n${s.location ? `📍 ${s.location}` : 'No location set'}`;
          }).join('\n\n'));

        await message.reply({ embeds: [embed] });
        break;
      }

      default:
        await message.reply('Usage: `!scene <start|end|tag|location|list> [args]`');
    }
  } catch (error) {
    console.error('Error in !scene command:', error);
    await message.reply('❌ Failed to handle scene command.');
  }
}

// ==================== UTILITY COMMANDS ====================
async function handleTime(message: Message, args: string[]) {
  try {
    const guildId = message.guild?.id || '';

    if (args.length === 0) {
      // Show current time
      const [time] = await db.select()
        .from(gameTime)
        .where(eq(gameTime.guildId, guildId));

      if (!time) {
        await message.reply('⏰ No game time set for this server. Use `!time set <date/time>` to set it.');
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#f39c12')
        .setTitle('⏰ Current Game Time')
        .addFields(
          { name: 'Date', value: time.currentDate, inline: true },
          { name: 'Time of Day', value: time.currentTime || 'Not set', inline: true },
          { name: 'Calendar System', value: time.calendar || 'Standard', inline: true }
        );

      if (time.notes) {
        embed.addFields({ name: 'Notes', value: time.notes });
      }

      await message.reply({ embeds: [embed] });
    } else if (args[0] === 'set') {
      // Set game time
      const timeString = args.slice(1).join(' ');
      if (!timeString) {
        await message.reply('Usage: `!time set <date and time>`\nExample: `!time set 15th of Mirtul, 1492 DR - Evening`');
        return;
      }

      const [existing] = await db.select()
        .from(gameTime)
        .where(eq(gameTime.guildId, guildId));

      if (existing) {
        await db.update(gameTime)
          .set({
            currentDate: timeString,
            updatedBy: message.author.id,
            updatedAt: new Date()
          })
          .where(eq(gameTime.guildId, guildId));
      } else {
        await db.insert(gameTime).values({
          guildId,
          currentDate: timeString,
          updatedBy: message.author.id
        });
      }

      await message.reply(`⏰ Game time set to: **${timeString}**`);
    }
  } catch (error) {
    console.error('Error in !time command:', error);
    await message.reply('❌ Failed to handle time command.');
  }
}

async function handleNote(message: Message, args: string[]) {
  try {
    const subcmd = args[0]?.toLowerCase();

    // Find user by Discord ID
    const [user] = await db.select()
      .from(users)
      .where(eq(users.discordUserId, message.author.id));

    if (!user) {
      await message.reply('❌ You need to connect your account first. Use `!connect <username> <password>`');
      return;
    }

    const guildId = message.guild?.id || '';

    switch (subcmd) {
      case 'add': {
        const content = args.slice(1).join(' ');
        if (!content) {
          await message.reply('Usage: `!note add <your note>`');
          return;
        }

        await db.insert(gmNotes).values({
          userId: user.id,
          guildId,
          title: `Note - ${new Date().toLocaleDateString()}`,
          content
        });

        await message.reply('📝 Note saved!');
        break;
      }

      case 'list': {
        const notes = await db.select()
          .from(gmNotes)
          .where(and(
            eq(gmNotes.userId, user.id),
            eq(gmNotes.guildId, guildId)
          ))
          .orderBy(desc(gmNotes.createdAt))
          .limit(10);

        if (notes.length === 0) {
          await message.reply('You have no notes for this server.');
          return;
        }

        const embed = new EmbedBuilder()
          .setColor('#95a5a6')
          .setTitle('📝 Your Notes')
          .setDescription(notes.map((n, i) =>
            `**${i + 1}.** ${n.title}\n${n.content.substring(0, 100)}${n.content.length > 100 ? '...' : ''}`
          ).join('\n\n'));

        await message.reply({ embeds: [embed] });
        break;
      }

      default:
        await message.reply('Usage: `!note <add|list> [args]`');
    }
  } catch (error) {
    console.error('Error in !note command:', error);
    await message.reply('❌ Failed to handle note command.');
  }
}

async function handleHC(message: Message, args: string[]) {
  try {
    const discordUserId = message.author.id;
    const guildId = message.guild?.id || '';
    const subcmd = args[0]?.toLowerCase();

    // If first arg is "list", show all entries
    if (subcmd === 'list') {
      const entries = await db.select()
        .from(hcList)
        .where(and(
          eq(hcList.discordUserId, discordUserId),
          eq(hcList.guildId, guildId)
        ))
        .orderBy(hcList.createdAt);

      if (entries.length === 0) {
        await message.reply('You have no HC entries for this server.');
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('📋 Your HC List')
        .setDescription(entries.map((e, i) =>
          `**${i + 1}.** ${e.content}`
        ).join('\n'));

      await message.reply({ embeds: [embed] });
      return;
    }

    // If first arg is "edit" or "delete"
    if (subcmd === 'edit' || subcmd === 'delete') {
      const entryNum = parseInt(args[1]);
      if (isNaN(entryNum) || entryNum < 1) {
        await message.reply(`Usage: \`!hc ${subcmd} <number>\`\nUse \`!hc list\` to see entry numbers.`);
        return;
      }

      // Get all entries to find the one by index
      const entries = await db.select()
        .from(hcList)
        .where(and(
          eq(hcList.discordUserId, discordUserId),
          eq(hcList.guildId, guildId)
        ))
        .orderBy(hcList.createdAt);

      if (entryNum > entries.length) {
        await message.reply(`❌ Entry #${entryNum} doesn't exist. You have ${entries.length} entries.`);
        return;
      }

      const targetEntry = entries[entryNum - 1];

      if (subcmd === 'delete') {
        await db.delete(hcList)
          .where(eq(hcList.id, targetEntry.id));
        await message.reply(`✅ Deleted entry #${entryNum}: "${targetEntry.content}"`);
        return;
      }

      if (subcmd === 'edit') {
        const newContent = args.slice(2).join(' ');
        if (!newContent) {
          await message.reply('Usage: `!hc edit <number> <new text>`');
          return;
        }

        await db.update(hcList)
          .set({ content: newContent })
          .where(eq(hcList.id, targetEntry.id));

        await message.reply(`✅ Updated entry #${entryNum} to: "${newContent}"`);
        return;
      }
    }

    // Default: Add new entry (everything is the content)
    const content = args.join(' ');
    if (!content) {
      await message.reply(
        'Usage:\n' +
        '• `!hc <text>` - Add entry\n' +
        '• `!hc list` - Show all entries\n' +
        '• `!hc edit <#> <new text>` - Edit entry\n' +
        '• `!hc delete <#>` - Delete entry'
      );
      return;
    }

    await db.insert(hcList).values({
      discordUserId,
      guildId,
      content
    });

    await message.reply(`💡HC: ${content}`);

  } catch (error) {
    console.error('Error in !hc command:', error);
    await message.reply('❌ Failed to handle HC command.');
  }
}

// ==================== CHARACTER MEMORIES ====================
async function handleMemory(message: Message, args: string[]) {
  try {
    const guildId = message.guild?.id || '';
    const userId = message.author.id;

    // Parse: !Memory <Character> | <Memory>
    const fullText = args.join(' ');
    const parts = fullText.split('|').map(p => p.trim());

    if (parts.length < 2) {
      await message.reply(
        'Usage: `!Memory <Character> | <Memory>`\n\n' +
        'Examples:\n' +
        '• `!Memory Ogun | Had a dream about meeting their soulmate`\n' +
        '• `!Memory Elystrix | Discovered a secret about their past`\n\n' +
        'View memories: `!<Character> Memories`'
      );
      return;
    }

    const characterName = parts[0];
    const memory = parts.slice(1).join('|').trim();

    if (!characterName || !memory) {
      await message.reply('❌ Please provide both character name and memory.');
      return;
    }

    // Find character
    const [character] = await db.select()
      .from(characterSheets)
      .where(
        sql`LOWER(${characterSheets.name}) = LOWER(${characterName})`
      )
      .limit(1);

    if (!character) {
      await message.reply(`❌ Character "${characterName}" not found.`);
      return;
    }

    // Add memory
    await db.insert(characterMemories).values({
      characterId: character.id,
      guildId,
      memory,
      addedBy: userId
    });

    await message.reply(`✅ Memory added for **${character.name}**:\n"${memory}"`);

  } catch (error) {
    console.error('Error in !Memory command:', error);
    await message.reply('❌ Failed to add memory.');
  }
}

async function handleCharacterMemoriesView(message: Message, characterName: string) {
  try {
    const guildId = message.guild?.id || '';

    // Find character
    const [character] = await db.select()
      .from(characterSheets)
      .where(
        sql`LOWER(${characterSheets.name}) = LOWER(${characterName})`
      )
      .limit(1);

    if (!character) {
      // Don't reply if character not found (might be trying a dice roll)
      return;
    }

    // Get all memories for this character
    const memories = await db.select()
      .from(characterMemories)
      .where(eq(characterMemories.characterId, character.id))
      .orderBy(characterMemories.createdAt);

    if (memories.length === 0) {
      await message.reply(`📝 **${character.name}** has no memories yet.\n\nAdd one with: \`!Memory ${character.name} | <memory>\``);
      return;
    }

    // Build embed
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle(`📝 ${character.name}'s Memories`)
      .setDescription(memories.length === 1 ? '1 memory' : `${memories.length} memories`)
      .setTimestamp();

    // Add memories as numbered list
    const memoryList = memories.map((mem, idx) => {
      const date = new Date(mem.createdAt).toLocaleDateString();
      return `**${idx + 1}.** ${mem.memory}\n*Added ${date}*`;
    }).join('\n\n');

    embed.addFields({ name: 'Memories', value: memoryList.substring(0, 1024) }); // Discord limit

    if (memoryList.length > 1024) {
      embed.setFooter({ text: 'Some memories truncated due to length' });
    }

    await message.reply({ embeds: [embed] });

  } catch (error) {
    console.error('Error viewing character memories:', error);
    await message.reply('❌ Failed to retrieve memories.');
  }
}

async function handleNPC(message: Message, args: string[]) {
  const npcName = args.join(' ');
  if (!npcName) {
    await message.reply('Usage: `!npc <name>`\nExample: `!npc Mysterious Merchant`');
    return;
  }

  // Generate quick NPC stat block
  const stats = {
    str: Math.floor(Math.random() * 11) + 8,  // 8-18
    dex: Math.floor(Math.random() * 11) + 8,
    con: Math.floor(Math.random() * 11) + 8,
    int: Math.floor(Math.random() * 11) + 8,
    wis: Math.floor(Math.random() * 11) + 8,
    cha: Math.floor(Math.random() * 11) + 8
  };

  const hp = Math.floor(Math.random() * 30) + 10; // 10-40 HP
  const ac = Math.floor(Math.random() * 6) + 10;  // 10-15 AC

  const embed = new EmbedBuilder()
    .setColor('#16a085')
    .setTitle(`🎭 ${npcName}`)
    .setDescription('Quick NPC Stat Block')
    .addFields(
      { name: 'HP', value: `${hp}`, inline: true },
      { name: 'AC', value: `${ac}`, inline: true },
      { name: '\u200b', value: '\u200b', inline: true },
      { name: 'STR', value: `${stats.str}`, inline: true },
      { name: 'DEX', value: `${stats.dex}`, inline: true },
      { name: 'CON', value: `${stats.con}`, inline: true },
      { name: 'INT', value: `${stats.int}`, inline: true },
      { name: 'WIS', value: `${stats.wis}`, inline: true },
      { name: 'CHA', value: `${stats.cha}`, inline: true }
    )
    .setFooter({ text: 'Randomly generated NPC' });

  await message.reply({ embeds: [embed] });
}

async function handleMusic(message: Message) {
  const moods = [
    { mood: 'Epic Battle', suggestion: '🎵 Two Steps From Hell - Heart of Courage' },
    { mood: 'Mysterious', suggestion: '🎵 Adrian von Ziegler - Prophecy' },
    { mood: 'Tavern', suggestion: '🎵 Medieval Tavern Music' },
    { mood: 'Sad/Emotional', suggestion: '🎵 Peter Gundry - The Lonely Shepherd' },
    { mood: 'Exploration', suggestion: '🎵 Jeremy Soule - Skyrim Atmospheres' },
    { mood: 'Tense/Suspense', suggestion: '🎵 Dark Ambient Music' },
    { mood: 'Victory', suggestion: '🎵 E.S. Posthumus - Unstoppable' },
    { mood: 'Romance', suggestion: '🎵 Celtic Love Songs' },
    { mood: 'Horror', suggestion: '🎵 Atrium Carceri - Dark Ambient' },
    { mood: 'Peaceful', suggestion: '🎵 BrunuhVille - Spirit of the Wild' }
  ];

  const random = moods[Math.floor(Math.random() * moods.length)];

  const embed = new EmbedBuilder()
    .setColor('#1abc9c')
    .setTitle('🎵 Music Suggestion')
    .setDescription(`**Mood:** ${random.mood}\n**Suggestion:** ${random.suggestion}`)
    .setFooter({ text: 'Perfect for setting the scene!' });

  await message.reply({ embeds: [embed] });
}

async function handleRecap(message: Message) {
  try {
    const channelId = message.channel.id;

    // Find active session
    const [session] = await db.select()
      .from(sessions)
      .where(and(
        eq(sessions.channelId, channelId),
        sql`${sessions.endedAt} IS NULL`
      ));

    if (!session) {
      await message.reply('❌ No active session to recap. Start one with `!session start <title>`');
      return;
    }

    // Get message count
    const msgCount = await db.select({ count: sql<number>`count(*)` })
      .from(sessionMessages)
      .where(eq(sessionMessages.sessionId, session.id));

    // Get participants
    const participants = JSON.parse(session.participants || '[]');

    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle(`📋 Session Recap: ${session.title}`)
      .addFields(
        { name: 'Started', value: session.startedAt.toLocaleString(), inline: true },
        { name: 'Messages', value: `${msgCount[0]?.count || 0}`, inline: true },
        { name: 'Participants', value: `${participants.length}`, inline: true }
      )
      .setDescription('Session is ongoing. Use `!session end` to finalize.');

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in !recap command:', error);
    await message.reply('❌ Failed to generate recap.');
  }
}

// ==================== HALL OF FAME (STARBOARD) ====================
async function handleStarReaction(reaction: any) {
  try {
    const message = reaction.message;
    const starCount = reaction.count || 0;
    const STAR_THRESHOLD = 10; // Changed to 10 based on user preference
    const guildId = message.guild?.id || '';

    // Check if message is already in hall of fame
    const [existing] = await db.select()
      .from(hallOfFame)
      .where(eq(hallOfFame.messageId, message.id));

    if (starCount >= STAR_THRESHOLD) {
      // Add or update in Hall of Fame
      const contextMessages: any[] = [];

      // Fetch context messages (2 before and 2 after)
      try {
        const messages = await message.channel.messages.fetch({ limit: 5, around: message.id });
        messages.forEach((msg: any) => {
          if (msg.id !== message.id) {
            contextMessages.push({
              author: msg.author.username,
              content: msg.content,
              timestamp: msg.createdTimestamp
            });
          }
        });
      } catch (error) {
        console.error('Error fetching context messages:', error);
      }

      if (existing) {
        // Update star count
        await db.update(hallOfFame)
          .set({ starCount })
          .where(eq(hallOfFame.id, existing.id));
      } else {
        // Add to hall of fame
        await db.insert(hallOfFame).values({
          messageId: message.id,
          channelId: message.channel.id,
          guildId,
          authorId: message.author.id,
          characterName: null, // Could extract from webhook if needed
          content: message.content,
          starCount,
          contextMessages: JSON.stringify(contextMessages)
        });

        // Try to post to #hall-of-fame channel if it exists
        try {
          const guild = message.guild;
          if (guild) {
            const hallChannel = guild.channels.cache.find(
              (ch: any) => ch.name === 'hall-of-fame' && (ch.type === 0 || ch.type === 5)
            ) as TextChannel;

            if (hallChannel) {
              const embed = new EmbedBuilder()
                .setColor('#f1c40f')
                .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
                .setDescription(message.content || '*[No text content]*')
                .addFields({ name: 'Channel', value: `<#${message.channel.id}>`, inline: true })
                .addFields({ name: 'Stars', value: `⭐ ${starCount}`, inline: true })
                .setFooter({ text: `Message ID: ${message.id}` })
                .setTimestamp(message.createdTimestamp);

              const hallMessage = await hallChannel.send({ embeds: [embed] });

              // Store hall message ID
              await db.update(hallOfFame)
                .set({ hallMessageId: hallMessage.id })
                .where(eq(hallOfFame.messageId, message.id));
            }
          }
        } catch (error) {
          console.error('Error posting to hall-of-fame channel:', error);
        }
      }
    } else if (existing && starCount < STAR_THRESHOLD) {
      // Remove from hall of fame if stars drop below threshold
      await db.delete(hallOfFame)
        .where(eq(hallOfFame.id, existing.id));

      // Try to delete from hall channel
      if (existing.hallMessageId) {
        try {
          const guild = message.guild;
          if (guild) {
            const hallChannel = guild.channels.cache.find(
              (ch: any) => ch.name === 'hall-of-fame'
            ) as TextChannel;

            if (hallChannel) {
              const hallMsg = await hallChannel.messages.fetch(existing.hallMessageId);
              await hallMsg.delete();
            }
          }
        } catch (error) {
          console.error('Error deleting from hall-of-fame:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error handling star reaction:', error);
  }
}

// ==================== HALL OF FAME COMMANDS ====================
async function handleHall(message: Message, args: string[]) {
  try {
    const subcmd = args[0]?.toLowerCase();
    const guildId = message.guild?.id || '';

    if (subcmd === 'top') {
      // Show top 20 starred messages
      const topMessages = await db.select()
        .from(hallOfFame)
        .where(eq(hallOfFame.guildId, guildId))
        .orderBy(desc(hallOfFame.starCount))
        .limit(20);

      if (topMessages.length === 0) {
        await message.reply('⭐ No messages in the Hall of Fame yet! React with ⭐ to great moments.');
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#f1c40f')
        .setTitle('⭐ Hall of Fame - Top 20')
        .setDescription(topMessages.map((msg, i) => {
          const preview = msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '');
          return `${i + 1}. **${msg.starCount}⭐** - ${preview}`;
        }).join('\n'))
        .setFooter({ text: `${topMessages.length} messages in Hall of Fame` });

      await message.reply({ embeds: [embed] });
    } else {
      // Show recent additions
      const recentMessages = await db.select()
        .from(hallOfFame)
        .where(eq(hallOfFame.guildId, guildId))
        .orderBy(desc(hallOfFame.addedToHallAt))
        .limit(10);

      if (recentMessages.length === 0) {
        await message.reply('⭐ No messages in the Hall of Fame yet! React with ⭐ to great moments.');
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#f1c40f')
        .setTitle('⭐ Hall of Fame - Recent')
        .setDescription(recentMessages.map((msg, i) => {
          const preview = msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '');
          return `${i + 1}. **${msg.starCount}⭐** - ${preview}`;
        }).join('\n'))
        .setFooter({ text: 'Use !hall top for the top 20' });

      await message.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Error in !hall command:', error);
    await message.reply('❌ Failed to retrieve Hall of Fame.');
  }
}

// ==================== BOT SETTINGS ====================
async function handleBotSet(message: Message, args: string[]) {
  // Check admin permissions
  if (!isAdmin(message)) {
    await message.reply('❌ Only administrators can change bot settings.');
    return;
  }

  const guildId = message.guild?.id || '';
  const channelId = message.channel.id;

  try {
    // Check if settings exist
    const [existing] = await db.select()
      .from(botSettings)
      .where(eq(botSettings.guildId, guildId));

    if (existing) {
      await db.update(botSettings)
        .set({
          announcementChannelId: channelId,
          updatedAt: new Date()
        })
        .where(eq(botSettings.guildId, guildId));
    } else {
      await db.insert(botSettings).values({
        guildId,
        announcementChannelId: channelId
      });
    }

    await message.reply(`✅ Bot announcement channel set to <#${channelId}>!\n\nThis channel will be used for:\n• Daily prompts (when scheduled)\n• Challenges\n• Bot announcements`);
  } catch (error) {
    console.error('Error in !botset command:', error);
    await message.reply('❌ Failed to set bot channel.');
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
