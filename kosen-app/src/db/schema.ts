import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------- Enums ----------

export const announcementCategoryEnum = pgEnum("announcement_category", [
  "for_you",
  "news",
  "events",
]);

export const userRoleEnum = pgEnum("user_role", ["user", "counselor", "admin"]);

// ---------- Tables ----------

export const users = pgTable("users", {
  userId: uuid("user_id").primaryKey(),
  studentId: varchar("student_id", { length: 20 }).unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  emergencyPhone: varchar("emergency_phone", { length: 20 }),
  department: varchar("department", { length: 100 }),
  year: integer("year"),
  dormBuilding: varchar("dorm_building", { length : 50 }),
  dormRoom: varchar("dorm_room", { length: 50 }),
  avatarUrl: text("avatar_url"),
  isConsented: boolean("is_consented").notNull().default(false),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    subscriptionId: uuid("subscription_id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("push_subscriptions_user_id_idx").on(table.userId),
  }),
);

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    category: announcementCategoryEnum("category").notNull().default("news"),
    authorId: uuid("author_id").references(() => users.userId, {
      onDelete: "set null",
    }),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("announcements_category_idx").on(table.category),
    authorIdIdx: index("announcements_author_id_idx").on(table.authorId),
  }),
);

export const announcementAttachments = pgTable(
  "announcement_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    announcementId: uuid("announcement_id")
      .notNull()
      .references(() => announcements.id, { onDelete: "cascade" }),
    fileUrl: text("file_url").notNull(),
    fileType: varchar("file_type", { length: 50 }).default("image"),
    displayOrder: integer("display_order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    announcementIdIdx: index("announcement_attachments_announcement_id_idx").on(
      table.announcementId,
    ),
  }),
);

// ---------- Relations ----------

export const usersRelations = relations(users, ({ many }) => ({
  pushSubscriptions: many(pushSubscriptions),
  announcements: many(announcements),
}));

export const pushSubscriptionsRelations = relations(
  pushSubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [pushSubscriptions.userId],
      references: [users.userId],
    }),
  }),
);

export const announcementsRelations = relations(
  announcements,
  ({ one, many }) => ({
    author: one(users, {
      fields: [announcements.authorId],
      references: [users.userId],
    }),
    attachments: many(announcementAttachments),
  }),
);

export const announcementAttachmentsRelations = relations(
  announcementAttachments,
  ({ one }) => ({
    announcement: one(announcements, {
      fields: [announcementAttachments.announcementId],
      references: [announcements.id],
    }),
  }),
);
