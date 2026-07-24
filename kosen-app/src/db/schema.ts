import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const rooms = pgTable("rooms", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});