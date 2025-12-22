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
