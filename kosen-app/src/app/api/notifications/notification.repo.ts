import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export async function findActiveRecipientIds(ids: string[]) {
  return db.select({ userId: users.userId }).from(users).where(and(inArray(users.userId, ids), isNull(users.deletedAt)));
}

export async function findActiveAdminIds() {
  return db
    .select({ userId: users.userId })
    .from(users)
    .where(and(eq(users.role, "admin"), isNull(users.deletedAt)));
}
