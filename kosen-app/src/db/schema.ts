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
  uniqueIndex, 
  date, 
  time,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ---------- Enums ----------

export const announcementCategoryEnum = pgEnum("announcement_category", [
  "for_you",
  "news",
  "events",
]);

export const userRoleEnum = pgEnum("user_role", ["user", "counselor", "admin"]);

export const itemTypeEnum = pgEnum("item_type", ["calculator", "charger"]);

export const unitStatusEnum = pgEnum("unit_status", [
  "available",
  "out",
  "repair",
  "lost",
]);

export const slotKindEnum = pgEnum("slot_kind", ["normal", "exam"]);

export const loanStatusEnum = pgEnum("loan_status", [
  "pending",
  "approved",
  "delivered",
  "returned",
  "overdue",
  "cancelled",
  "rejected",
  "expired",
  "no_show",
]);

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
  dormBuilding: varchar("dorm_building", { length: 50 }),
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
    targetYear: integer("target_year"),
    targetDepartment: varchar("target_department", { length: 100 }),
    category: announcementCategoryEnum("category"),
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
    fileUrl: text("file_url"),
    storagePath: text("storage_path"),
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

export const terms = pgTable("terms", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // เช่น "1/2569"
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}); // semester/term

export const slots = pgTable("slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: slotKindEnum("kind").notNull(), // normal | exam
  startTime: time("start_time").notNull(), // Asia/Bangkok
  endTime: time("end_time").notNull(),
  leadMin: integer("lead_min").notNull(), // Advance notice required (minutes): 5 / 10
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}); // slots

export const units = pgTable(
  "units",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 30 }).notNull().unique(), // เช่น CALC-012, CHG-003
    itemType: itemTypeEnum("item_type").notNull(),
    status: unitStatusEnum("status").notNull().default("available"),
    isActive: boolean("is_active").notNull().default(true), // "ปิดใช้" unit
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    typeStatusIdx: index("units_item_type_status_idx").on(
      table.itemType,
      table.status,
    ),
  }),
); //units

export const loans = pgTable(
  "loans",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    borrowerId: uuid("borrower_id")
      .notNull()
      .references(() => users.userId, { onDelete: "restrict" }),
    itemType: itemTypeEnum("item_type").notNull(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "restrict" }),
    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "restrict" }),
    slotId: uuid("slot_id")
      .notNull()
      .references(() => slots.id, { onDelete: "restrict" }),
    slotDate: date("slot_date").notNull(),

    status: loanStatusEnum("status").notNull().default("pending"),

    // Approved by Admin = Responsible Person (Can be NULL when pending)
    approvedBy: uuid("approved_by").references(() => users.userId, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectReason: text("reject_reason"),
    cancelReason: text("cancel_reason"), // when admin cancel

    requestedAt: timestamp("requested_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    returnRequestedAt: timestamp("return_requested_at", { withTimezone: true }), //user has already returned
    returnedAt: timestamp("returned_at", { withTimezone: true }), // when admin has confirmed the return
    isLate: boolean("is_late").notNull().default(false),

    conditionOut: text("condition_out"), // Condition before dispatch (admin)
    conditionIn: text("condition_in"), // Condition upon return (admin)
    returnNote: text("return_note"), // Condition notes from borrower

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // quota of calculator per term
    quotaIdx: index("loans_quota_idx").on(
      table.borrowerId,
      table.termId,
      table.itemType,
      table.status,
    ),
    // Check calculator loan status once a day
    borrowerDayIdx: index("loans_borrower_item_date_idx").on(
      table.borrowerId,
      table.itemType,
      table.slotDate,
    ),
    // Check available items + today's queue
    slotIdx: index("loans_slot_date_slot_idx").on(table.slotDate, table.slotId),
    // "My Tasks" for admin
    approverIdx: index("loans_approved_by_status_idx").on(
      table.approvedBy,
      table.status,
    ),
    unitIdx: index("loans_unit_id_idx").on(table.unitId),

    // Prevents double-booking the same unit in the same time slot, even with concurrent requests (safety net via transaction + lock)
    unitSlotActiveUq: uniqueIndex("loans_unit_slot_active_uq")
      .on(table.unitId, table.slotDate, table.slotId)
      .where(sql`status in ('pending','approved','delivered','overdue')`),

    // Limits calculator loans to 1 request/day/user (excludes cancelled, rejected, and expired)
    calcPerDayUq: uniqueIndex("loans_calc_per_day_uq")
      .on(table.borrowerId, table.slotDate)
      .where(
        sql`item_type = 'calculator' and status in ('pending','approved','delivered','returned','overdue','no_show')`,
      ),
  }),
); // loans

// ---------- Relations ----------

export const usersRelations = relations(users, ({ many }) => ({
  pushSubscriptions: many(pushSubscriptions),
  announcements: many(announcements),
  borrowedLoans: many(loans, { relationName: "loan_borrower" }),
  approvedLoans: many(loans, { relationName: "loan_approver" }),
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

export const termsRelations = relations(terms, ({ many }) => ({
  loans: many(loans),
}));

export const slotsRelations = relations(slots, ({ many }) => ({
  loans: many(loans),
}));

export const unitsRelations = relations(units, ({ many }) => ({
  loans: many(loans),
}));

export const loansRelations = relations(loans, ({ one }) => ({
  borrower: one(users, {
    fields: [loans.borrowerId],
    references: [users.userId],
    relationName: "loan_borrower",
  }),
  approver: one(users, {
    fields: [loans.approvedBy],
    references: [users.userId],
    relationName: "loan_approver",
  }),
  unit: one(units, {
    fields: [loans.unitId],
    references: [units.id],
  }),
  term: one(terms, {
    fields: [loans.termId],
    references: [terms.id],
  }),
  slot: one(slots, {
    fields: [loans.slotId],
    references: [slots.id],
  }),
}));
