import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email'),
  // PathCompanion account binding (optional)
  pathCompanionUsername: text('path_companion_username'),
  pathCompanionPassword: text('path_companion_password'), // Encrypted
  pathCompanionSessionTicket: text('path_companion_session_ticket'),
  pathCompanionPlayfabId: text('path_companion_playfab_id'),
  pathCompanionConnectedAt: timestamp('path_companion_connected_at'),
  // Discord integration
  discordUserId: text('discord_user_id').unique(), // Discord user ID for bot authentication
  discordBotToken: text('discord_bot_token'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  content: text('content'),
  userId: integer('user_id').notNull().references(() => users.id),
  parentId: integer('parent_id'),
  isFolder: boolean('is_folder').default(false).notNull(),
  s3Key: text('s3_key'),
  mimeType: text('mime_type'),
  size: integer('size'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const sharedDocuments = pgTable('shared_documents', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').notNull().references(() => documents.id),
  userId: integer('user_id').notNull().references(() => users.id),
  canEdit: boolean('can_edit').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const characterSheets = pgTable('character_sheets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  // Core stats (3-18 range typical for D&D)
  strength: integer('strength').notNull().default(10),
  dexterity: integer('dexterity').notNull().default(10),
  constitution: integer('constitution').notNull().default(10),
  intelligence: integer('intelligence').notNull().default(10),
  wisdom: integer('wisdom').notNull().default(10),
  charisma: integer('charisma').notNull().default(10),
  // Additional info
  characterClass: text('character_class'),
  level: integer('level').default(1),
  race: text('race'),
  alignment: text('alignment'),
  deity: text('deity'),
  size: text('size').default('Medium'),
  // Combat stats
  currentHp: integer('current_hp').default(0),
  maxHp: integer('max_hp').default(0),
  tempHp: integer('temp_hp').default(0),
  armorClass: integer('armor_class').default(10),
  touchAc: integer('touch_ac').default(10),
  flatFootedAc: integer('flat_footed_ac').default(10),
  initiative: integer('initiative').default(0),
  speed: integer('speed').default(30),
  baseAttackBonus: integer('base_attack_bonus').default(0),
  cmb: integer('cmb').default(0),
  cmd: integer('cmd').default(10),
  // Saving throws
  fortitudeSave: integer('fortitude_save').default(0),
  reflexSave: integer('reflex_save').default(0),
  willSave: integer('will_save').default(0),
  // Skills (stored as JSON for flexibility)
  skills: text('skills'), // JSON string of {skillName: {ranks: number, misc: number}}
  // Equipment & abilities
  weapons: text('weapons'), // JSON array of weapon objects
  armor: text('armor'), // JSON string of armor details
  feats: text('feats'), // JSON array of feat names
  specialAbilities: text('special_abilities'), // JSON array of ability descriptions
  spells: text('spells'), // JSON object of spells by level
  // PathCompanion integration
  isPathCompanion: boolean('is_path_companion').default(false),
  pathCompanionId: text('path_companion_id'), // Character ID in PlayFab
  pathCompanionData: text('path_companion_data'), // JSON string of full character data
  pathCompanionSession: text('path_companion_session'), // Session ticket for syncing
  lastSynced: timestamp('last_synced'),
  // Discord proxying
  avatarUrl: text('avatar_url'), // Avatar URL for Discord webhooks
  // Character Bio - Comprehensive Profile
  // Basic Identity
  fullName: text('full_name'),
  titles: text('titles'),
  species: text('species'),
  ageDescription: text('age_description'),
  culturalBackground: text('cultural_background'),
  pronouns: text('pronouns'),
  genderIdentity: text('gender_identity'),
  sexuality: text('sexuality'),
  occupation: text('occupation'),
  currentLocation: text('current_location'),
  // Goals & Motivations
  currentGoal: text('current_goal'),
  longTermDesire: text('long_term_desire'),
  coreMotivation: text('core_motivation'),
  deepestFear: text('deepest_fear'),
  coreBelief: text('core_belief'),
  coreMisconception: text('core_misconception'),
  moralCode: text('moral_code'),
  alignmentTendency: text('alignment_tendency'),
  // Personality
  personalityOneSentence: text('personality_one_sentence'),
  keyVirtues: text('key_virtues'),
  keyFlaws: text('key_flaws'),
  stressBehavior: text('stress_behavior'),
  habitsOrTells: text('habits_or_tells'),
  speechStyle: text('speech_style'),
  // Appearance
  physicalPresence: text('physical_presence'),
  identifyingTraits: text('identifying_traits'),
  clothingAesthetic: text('clothing_aesthetic'),
  // Skills & Abilities
  notableEquipment: text('notable_equipment'),
  skillsReliedOn: text('skills_relied_on'),
  skillsAvoided: text('skills_avoided'),
  // Backstory (Markdown)
  origin: text('origin'),
  greatestSuccess: text('greatest_success'),
  greatestFailure: text('greatest_failure'),
  regret: text('regret'),
  trauma: text('trauma'),
  // Relationships (Markdown)
  importantRelationships: text('important_relationships'),
  protectedRelationship: text('protected_relationship'),
  avoidedRelationship: text('avoided_relationship'),
  rival: text('rival'),
  affiliatedGroups: text('affiliated_groups'),
  // Beliefs
  beliefsPhilosophy: text('beliefs_philosophy'),
  // Public vs Private
  publicFacade: text('public_facade'),
  hiddenAspect: text('hidden_aspect'),
  secret: text('secret'),
  // Growth & Change (Markdown)
  recentChange: text('recent_change'),
  potentialChange: text('potential_change'),
  breakingPoint: text('breaking_point'),
  redemption: text('redemption'),
  // Legacy
  symbolOrMotif: text('symbol_or_motif'),
  legacy: text('legacy'),
  rememberedAs: text('remembered_as'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  sharedDocuments: many(sharedDocuments),
  characterSheets: many(characterSheets)
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id]
  }),
  parent: one(documents, {
    fields: [documents.parentId],
    references: [documents.id]
  }),
  children: many(documents),
  sharedWith: many(sharedDocuments)
}));

export const sharedDocumentsRelations = relations(sharedDocuments, ({ one }) => ({
  document: one(documents, {
    fields: [sharedDocuments.documentId],
    references: [documents.id]
  }),
  user: one(users, {
    fields: [sharedDocuments.userId],
    references: [users.id]
  })
}));

export const characterSheetsRelations = relations(characterSheets, ({ one }) => ({
  user: one(users, {
    fields: [characterSheets.userId],
    references: [users.id]
  })
}));

export const channelCharacterMappings = pgTable('channel_character_mappings', {
  id: serial('id').primaryKey(),
  channelId: text('channel_id').notNull(),
  guildId: text('guild_id').notNull(),
  characterId: integer('character_id').notNull().references(() => characterSheets.id),
  userId: integer('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const channelCharacterMappingsRelations = relations(channelCharacterMappings, ({ one }) => ({
  character: one(characterSheets, {
    fields: [channelCharacterMappings.characterId],
    references: [characterSheets.id]
  }),
  user: one(users, {
    fields: [channelCharacterMappings.userId],
    references: [users.id]
  })
}));

// Knowledge Base for AI FAQ System
export const knowledgeBase = pgTable('knowledge_base', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  sourceUrl: text('source_url'),
  category: text('category'),
  aiGenerated: boolean('ai_generated').default(false),
  createdBy: integer('created_by').references(() => users.id),
  upvotes: integer('upvotes').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Character Stats Tracking
export const characterStats = pgTable('character_stats', {
  id: serial('id').primaryKey(),
  characterId: integer('character_id').notNull().references(() => characterSheets.id).unique(),
  totalMessages: integer('total_messages').default(0),
  totalDiceRolls: integer('total_dice_rolls').default(0),
  nat20Count: integer('nat20_count').default(0),
  nat1Count: integer('nat1_count').default(0),
  totalDamageDealt: integer('total_damage_dealt').default(0),
  lastActive: timestamp('last_active'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const characterStatsRelations = relations(characterStats, ({ one }) => ({
  character: one(characterSheets, {
    fields: [characterStats.characterId],
    references: [characterSheets.id]
  })
}));

// Activity Feed
export const activityFeed = pgTable('activity_feed', {
  id: serial('id').primaryKey(),
  characterId: integer('character_id').notNull().references(() => characterSheets.id),
  activityType: text('activity_type').notNull(), // 'message', 'roll', 'crit', 'fail', etc.
  description: text('description').notNull(),
  metadata: text('metadata'), // JSON string
  timestamp: timestamp('timestamp').defaultNow().notNull()
});

export const activityFeedRelations = relations(activityFeed, ({ one }) => ({
  character: one(characterSheets, {
    fields: [activityFeed.characterId],
    references: [characterSheets.id]
  })
}));

// Character Relationships
export const relationships = pgTable('relationships', {
  id: serial('id').primaryKey(),
  character1Id: integer('character1_id').notNull().references(() => characterSheets.id),
  character2Id: integer('character2_id').notNull().references(() => characterSheets.id),
  relationshipType: text('relationship_type'), // 'ally', 'rival', 'romantic', 'family', etc.
  intimacyLevel: integer('intimacy_level').default(0), // 0-10 scale
  notes: text('notes'),
  keyMoments: text('key_moments'), // JSON array
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const relationshipsRelations = relations(relationships, ({ one }) => ({
  character1: one(characterSheets, {
    fields: [relationships.character1Id],
    references: [characterSheets.id]
  }),
  character2: one(characterSheets, {
    fields: [relationships.character2Id],
    references: [characterSheets.id]
  })
}));

// File Uploads
export const files = pgTable('files', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  fileName: text('file_name').notNull(),
  originalFileName: text('original_file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(), // Size in bytes
  s3Key: text('s3_key').notNull().unique(),
  s3Bucket: text('s3_bucket').notNull(),
  documentId: integer('document_id').references(() => documents.id), // Optional link to a document
  virusScanStatus: text('virus_scan_status').default('pending'), // 'pending', 'clean', 'infected', 'error'
  virusScanDetails: text('virus_scan_details'), // JSON string with scan results
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at') // Soft delete
});

export const filesRelations = relations(files, ({ one }) => ({
  user: one(users, {
    fields: [files.userId],
    references: [users.id]
  }),
  document: one(documents, {
    fields: [files.documentId],
    references: [documents.id]
  })
}));

// System Settings (for app-wide configuration)
export const systemSettings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// RP Prompts
export const prompts = pgTable('prompts', {
  id: serial('id').primaryKey(),
  category: text('category').notNull(), // 'character', 'world', 'combat', 'social', 'plot'
  promptText: text('prompt_text').notNull(),
  createdBy: integer('created_by').references(() => users.id),
  useCount: integer('use_count').default(0),
  lastUsed: timestamp('last_used'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Tropes for RP inspiration
export const tropes = pgTable('tropes', {
  id: serial('id').primaryKey(),
  category: text('category').notNull(), // 'archetype', 'dynamic', 'situation', 'plot'
  name: text('name').notNull(),
  description: text('description').notNull(),
  useCount: integer('use_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Prompt Schedule (for automated posting)
export const promptSchedule = pgTable('prompt_schedule', {
  id: serial('id').primaryKey(),
  channelId: text('channel_id').notNull().unique(),
  guildId: text('guild_id').notNull(),
  scheduleTime: text('schedule_time').notNull(), // Cron format or "09:00"
  enabled: boolean('enabled').default(true),
  category: text('category'), // Optional: specific category for scheduled prompts
  lastSent: timestamp('last_sent'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// RP Sessions
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  channelId: text('channel_id').notNull(),
  guildId: text('guild_id').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  pausedAt: timestamp('paused_at'),
  isPaused: boolean('is_paused').default(false),
  participants: text('participants'), // JSON array of user IDs
  messageCount: integer('message_count').default(0),
  summary: text('summary'), // AI-generated summary
  tags: text('tags'), // JSON array
  createdBy: integer('created_by').references(() => users.id)
});

export const sessionMessages = pgTable('session_messages', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => sessions.id),
  messageId: text('message_id').notNull(),
  authorId: text('author_id').notNull(),
  characterName: text('character_name'),
  content: text('content').notNull(),
  isDiceRoll: boolean('is_dice_roll').default(false),
  timestamp: timestamp('timestamp').notNull()
});

export const sessionMessagesRelations = relations(sessionMessages, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionMessages.sessionId],
    references: [sessions.id]
  })
}));

// RP Scenes
export const scenes = pgTable('scenes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  channelId: text('channel_id').notNull(),
  guildId: text('guild_id').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  participants: text('participants'), // JSON array
  tags: text('tags'), // JSON array
  location: text('location'),
  isCombat: boolean('is_combat').default(false),
  summary: text('summary'),
  createdBy: integer('created_by').references(() => users.id)
});

export const sceneMessages = pgTable('scene_messages', {
  id: serial('id').primaryKey(),
  sceneId: integer('scene_id').notNull().references(() => scenes.id),
  messageId: text('message_id').notNull(),
  authorId: text('author_id').notNull(),
  characterName: text('character_name'),
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').notNull()
});

export const sceneMessagesRelations = relations(sceneMessages, ({ one }) => ({
  scene: one(scenes, {
    fields: [sceneMessages.sceneId],
    references: [scenes.id]
  })
}));

// Hall of Fame (Starboard)
export const hallOfFame = pgTable('hall_of_fame', {
  id: serial('id').primaryKey(),
  messageId: text('message_id').notNull().unique(),
  channelId: text('channel_id').notNull(),
  guildId: text('guild_id').notNull(),
  authorId: text('author_id').notNull(),
  characterName: text('character_name'),
  content: text('content').notNull(),
  starCount: integer('star_count').default(0),
  contextMessages: text('context_messages'), // JSON array of surrounding messages
  hallMessageId: text('hall_message_id'), // Message ID in hall-of-fame channel
  addedToHallAt: timestamp('added_to_hall_at').defaultNow().notNull()
});

// GM Notes (private notes for game masters)
export const gmNotes = pgTable('gm_notes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  guildId: text('guild_id').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  tags: text('tags'), // JSON array
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const gmNotesRelations = relations(gmNotes, ({ one }) => ({
  user: one(users, {
    fields: [gmNotes.userId],
    references: [users.id]
  })
}));

// In-game time tracking
export const gameTime = pgTable('game_time', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull().unique(),
  currentDate: text('current_date').notNull(), // e.g., "15th of Mirtul, 1492 DR"
  currentTime: text('current_time'), // e.g., "Evening" or "14:30"
  calendar: text('calendar').default('Forgotten Realms'), // Calendar system
  notes: text('notes'),
  updatedBy: text('updated_by'), // Discord user ID
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Bot settings per guild
export const botSettings = pgTable('bot_settings', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull().unique(),
  announcementChannelId: text('announcement_channel_id'), // For prompts, challenges, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// HC (House Call/Custom) list - user-specific quick notes
export const hcList = pgTable('hc_list', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  guildId: text('guild_id').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const hcListRelations = relations(hcList, ({ one }) => ({
  user: one(users, {
    fields: [hcList.userId],
    references: [users.id]
  })
}));
