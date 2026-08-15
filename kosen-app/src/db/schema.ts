import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  date,
  time,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------- Enums ----------
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "reminder",
  "confirmation",
  "cancellation",
]);

// ---------- Tables ----------

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  userId: uuid("user_id").defaultRandom().primaryKey(),
  studentId: varchar("student_id", { length: 20 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  emergencyPhone: varchar("emergency_phone", { length: 20 }),
  department: varchar("department", { length: 100 }),
  isConsented: boolean("is_consented").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const counselors = pgTable("counselors", {
  counselorId: uuid("counselor_id").defaultRandom().primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  nickname: varchar("nickname", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  lineId: varchar("line_id", { length: 100 }),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  detail: text("detail"),
});

export const appointments = pgTable(
  "appointments",
  {
    appointmentId: uuid("appointment_id").defaultRandom().primaryKey(),
    appointmentCode: varchar("appointment_code", { length: 20 })
      .notNull()
      .unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    counselorId: uuid("counselor_id").references(() => counselors.counselorId),
    appointmentDate: date("appointment_date").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    note: text("note"),
    status: appointmentStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("appointments_user_id_idx").on(table.userId),
    counselorIdIdx: index("appointments_counselor_id_idx").on(
      table.counselorId,
    ),
    appointmentDateIdx: index("appointments_appointment_date_idx").on(
      table.appointmentDate,
    ),
    statusIdx: index("appointments_status_idx").on(table.status),
    counselorDateIdx: index("appointments_counselor_id_date_idx").on(
      table.counselorId,
      table.appointmentDate,
    ),
    userDateIdx: index("appointments_user_id_date_idx").on(
      table.userId,
      table.appointmentDate,
    ),
  }),
);

export const medicalHistoryForms = pgTable(
  "medical_history_forms",
  {
    formId: uuid("form_id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id").references(
      () => appointments.appointmentId,
      { onDelete: "cascade" },
    ),
    hasConsultedPsychiatrist: boolean("has_consulted_psychiatrist"),
    psychiatricVisitCount: integer("psychiatric_visit_count"),
    consultationDate: date("consultation_date"),
    hospitalOrClinic: varchar("hospital_or_clinic", { length: 255 }),
    doctorOrPsychologistName: varchar("doctor_or_psychologist_name", {
      length: 255,
    }),
    pastProblem: text("past_problem"),
    currentMedication: text("current_medication"),
    medicationResult: text("medication_result"),
    hasChronicDisease: boolean("has_chronic_disease"),
    chronicDiseaseName: varchar("chronic_disease_name", { length: 255 }),
    chronicDiseaseSymptom: text("chronic_disease_symptom"),
    treatmentDetail: text("treatment_detail"),
    drugAllergyDetail: text("drug_allergy_detail"),
    foodOrOtherAllergyDetail: text("food_or_other_allergy_detail"),
    hasAccident: boolean("has_accident"),
    accidentDetail: text("accident_detail"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("medical_history_forms_user_id_idx").on(table.userId),
    appointmentIdIdx: index("medical_history_forms_appointment_id_idx").on(
      table.appointmentId,
    ),
  }),
);

export const familyHistory = pgTable(
  "family_history",
  {
    familyHistoryId: uuid("family_history_id").defaultRandom().primaryKey(),
    formId: uuid("form_id")
      .notNull()
      .references(() => medicalHistoryForms.formId, { onDelete: "cascade" }),
    relationship: varchar("relationship", { length: 100 }),
    age: integer("age"),
    phone: varchar("phone", { length: 20 }),
    healthHistory: text("health_history"),
  },
  (table) => ({
    formIdIdx: index("family_history_form_id_idx").on(table.formId),
  }),
);

export const notifications = pgTable(
  "notifications",
  {
    notificationId: uuid("notification_id").defaultRandom().primaryKey(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.appointmentId, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    detail: text("detail"),
    sentAt: timestamp("sent_at"),
  },
  (table) => ({
    appointmentIdIdx: index("notifications_appointment_id_idx").on(
      table.appointmentId,
    ),
  }),
);

export const posts = pgTable("posts", {
  postId: uuid("post_id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  content: text("content"),
  imageUrl: text("image_url"),
  deleteAt: timestamp("delete_at"),
  createAt: timestamp("create_at"),
  updateAt: timestamp("update_at"),
});

export const tags = pgTable("tags", {
  tagId: uuid("tag_id").defaultRandom().primaryKey(),
  tagName: text("tag_name"),
});

export const postTags = pgTable("postTags", {
  postId: uuid("post_id")
    .notNull()
    .references(() => posts.postId, { onDelete: "cascade" }),
  tagId: uuid("tag_id")
    .notNull()
    .references(() => tags.tagId, { onDelete: "cascade" }),
});

export const comments = pgTable("comments", {
  commentId: uuid("comment_id").defaultRandom().primaryKey(),
  postId: uuid("post_id")
    .notNull()
    .references(() => posts.postId, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  parentId: uuid("parent_id"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const postLikes = pgTable("post_likes", {
  postId: uuid("post_id")
    .notNull()
    .references(() => posts.postId, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const postShares = pgTable("post_shares", {
  postId: uuid("post_id")
    .notNull()
    .references(() => posts.postId, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Relations ----------

export const usersRelations = relations(users, ({ many }) => ({
  appointments: many(appointments),
  medicalHistoryForms: many(medicalHistoryForms),
  posts: many(posts),
  comments: many(comments),
}));

export const counselorsRelations = relations(counselors, ({ many }) => ({
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(
  appointments,
  ({ one, many }) => ({
    user: one(users, {
      fields: [appointments.userId],
      references: [users.userId],
    }),
    counselor: one(counselors, {
      fields: [appointments.counselorId],
      references: [counselors.counselorId],
    }),
    medicalHistoryForm: one(medicalHistoryForms),
    notifications: many(notifications),
  }),
);

export const medicalHistoryFormsRelations = relations(
  medicalHistoryForms,
  ({ one, many }) => ({
    user: one(users, {
      fields: [medicalHistoryForms.userId],
      references: [users.userId],
    }),
    appointment: one(appointments, {
      fields: [medicalHistoryForms.appointmentId],
      references: [appointments.appointmentId],
    }),
    familyHistory: many(familyHistory),
  }),
);

export const familyHistoryRelations = relations(familyHistory, ({ one }) => ({
  form: one(medicalHistoryForms, {
    fields: [familyHistory.formId],
    references: [medicalHistoryForms.formId],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  appointment: one(appointments, {
    fields: [notifications.appointmentId],
    references: [appointments.appointmentId],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.userId], references: [users.userId] }),
  comments: many(comments),
  tags: many(postTags),
  likes: many(postLikes),
  shares: many(postShares),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  posts: many(postTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, { fields: [postTags.postId], references: [posts.postId] }),
  tag: one(tags, { fields: [postTags.tagId], references: [tags.tagId] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.postId] }),
  author: one(users, { fields: [comments.userId], references: [users.userId] }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.commentId],
  }),
}));
