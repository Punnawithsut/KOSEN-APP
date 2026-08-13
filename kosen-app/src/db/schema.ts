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
  uniqueIndex,
  unique,
} from "drizzle-orm/pg-core";
import { relations,sql } from "drizzle-orm";

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

export const repairmentRequestStatusEnum = pgEnum("repairment_request_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

// ---------- Tables ----------

export const users = pgTable("users", {
  userId: uuid("user_id").defaultRandom().primaryKey(),
  studentId: varchar("student_id", { length: 20 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  emergencyPhone: varchar("emergency_phone", { length: 20 }),
  department: varchar("department", { length: 100 }),
  isConsented: boolean("is_consented").notNull().default(false),
  dormPoints: integer("dorm_points").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dormBuildings = pgTable("dorm_buildings", {
  buildingId: uuid("building_id").defaultRandom().primaryKey(),
  buildingNumber: integer("building_number").notNull().unique(),
});

export const dormRooms = pgTable("dorm_rooms", {
  roomId: uuid("room_id").defaultRandom().primaryKey(),
  buildingId: uuid("building_id")
    .notNull()
    .references(() => dormBuildings.buildingId, { onDelete: "cascade" }),
  roomNumber: varchar("room_number", { length: 4 }).notNull(),
  roomPhotoUrl: text("room_photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
},
(table) => ({
    buildingRoomUnique: unique().on(
      table.buildingId,
      table.roomNumber,
    ),
  })
);

export const dormRoomAssignments = pgTable("dorm_room_assignments", {
  assignmentId: uuid("assignment_id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  roomId: uuid("room_id")
    .notNull()
    .references(() => dormRooms.roomId, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
},
(table) => ({
    userRoomUnique: uniqueIndex("user_room_unique").on(
      table.userId
    ).where(sql`${table.endedAt} IS NULL`),
  })
);

export const repairmentRequests = pgTable("repairment_requests", {
  repairmentRequestId: uuid("repairment_request_id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  description: text("description").notNull(),
  status: repairmentRequestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dormPointChanges = pgTable("dorm_points_changes", {
  dormPointChangesid: uuid("dorm_point_changes_id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

// ---------- Relations ----------

export const usersRelations = relations(users, ({ many }) => ({
  appointments: many(appointments),
  medicalHistoryForms: many(medicalHistoryForms),

  dormRoomAssignments: many(dormRoomAssignments),
  dormPointChanges: many(dormPointChanges),
  repairmentRequests: many(repairmentRequests),
}));

export const dormBuildingsRelations = relations(dormBuildings, ({ many }) => ({
  dormRooms: many(dormRooms),
}));

export const dormRoomsRelations = relations(dormRooms, ({ one, many }) => ({
  building: one(dormBuildings, {
    fields: [dormRooms.buildingId],
    references: [dormBuildings.buildingId],
  }),
  assignments: many(dormRoomAssignments),
}));

export const dormRoomAssignmentsRelations = relations(dormRoomAssignments, ({ one }) => ({
  user: one(users, {
    fields: [dormRoomAssignments.userId],
    references: [users.userId],
  }),
  room: one(dormRooms, {
    fields: [dormRoomAssignments.roomId],
    references: [dormRooms.roomId],
  }),
}));

export const repairmentRequestsRelations = relations(repairmentRequests, ({ one }) => ({
  user: one(users, {
    fields: [repairmentRequests.userId],
    references: [users.userId],
  }),
}));

export const dormPointChangesRelations = relations(dormPointChanges, ({ one }) => ({
  user: one(users, {
    fields: [dormPointChanges.userId],
    references: [users.userId],
  }),
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
