import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email'),
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
  // PathCompanion integration
  isPathCompanion: boolean('is_path_companion').default(false),
  pathCompanionId: text('path_companion_id'), // Character ID in PlayFab
  pathCompanionData: text('path_companion_data'), // JSON string of full character data
  pathCompanionSession: text('path_companion_session'), // Session ticket for syncing
  lastSynced: timestamp('last_synced'),
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
