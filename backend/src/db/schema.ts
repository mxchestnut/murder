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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  sharedDocuments: many(sharedDocuments)
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
