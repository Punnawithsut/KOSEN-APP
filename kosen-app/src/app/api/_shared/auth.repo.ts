import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export async function hasActiveUser(userId: string) {
  const row = await db.query.users.findFirst({ where: and(eq(users.userId, userId), isNull(users.deletedAt)), columns: { userId: true } });
  return Boolean(row);
}

export async function isActiveAdmin(userId: string) {
  const row = await db.query.users.findFirst({ where: and(eq(users.userId, userId), isNull(users.deletedAt)), columns: { role: true } });
  return row?.role === "admin";
}
