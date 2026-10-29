import { and, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export async function findActiveRecipientIds(ids: string[]) {
  return db.select({ userId: users.userId }).from(users).where(and(inArray(users.userId, ids), isNull(users.deletedAt)));
}
