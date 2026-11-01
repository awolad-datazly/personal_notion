import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "USER"]);
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export const resourceTypeEnum = pgEnum("resource_type", ["YOUTUBE", "ARTICLE"]);
export const resourceStatusEnum = pgEnum("resource_status", [
  "TO_READ",
  "COMPLETED",
]);

/** A playback mark stored beside a vault note. `seconds` is the player position. */
export type NoteTimestamp = {
  seconds: number;
  label?: string;
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    image: text("image"),
    emailVerified: timestamp("email_verified", {
      withTimezone: true,
      mode: "date",
    }),
    role: userRoleEnum("role").notNull().default("USER"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
    index("accounts_user_id_idx").on(table.userId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const resources = pgTable(
  "resources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: resourceTypeEnum("type").notNull(),
    url: text("url").notNull(),
    title: text("title").notNull(),
    domain: text("domain"),
    status: resourceStatusEnum("status").notNull().default("TO_READ"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("resources_user_id_idx").on(table.userId),
    index("resources_user_status_idx").on(table.userId, table.status),
  ],
);

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull().default(""),
    timestamps: jsonb("timestamps")
      .$type<NoteTimestamp[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("notes_resource_id_unique").on(table.resourceId),
    index("notes_user_id_idx").on(table.userId),
  ],
);

export const techNews = pgTable(
  "tech_news",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    summary: text("summary"),
    category: text("category"),
    isMustLearn: boolean("is_must_learn").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("tech_news_url_unique").on(table.url),
    index("tech_news_category_idx").on(table.category),
    index("tech_news_must_learn_idx").on(table.isMustLearn),
  ],
);

export const featureFlags = pgTable(
  "feature_flags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    isEnabledForPublic: boolean("is_enabled_for_public")
      .notNull()
      .default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("feature_flags_key_unique").on(table.key)],
);

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  resources: many(resources),
  notes: many(notes),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  user: one(users, {
    fields: [resources.userId],
    references: [users.id],
  }),
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  resource: one(resources, {
    fields: [notes.resourceId],
    references: [resources.id],
  }),
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type SessionRecord = typeof sessions.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type TechNewsItem = typeof techNews.$inferSelect;
export type NewTechNewsItem = typeof techNews.$inferInsert;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;
