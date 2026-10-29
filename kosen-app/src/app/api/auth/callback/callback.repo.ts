import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export function findUserByAuthId(userId: string) {
  return db.query.users.findFirst({ where: eq(users.userId, userId) });
}

export async function updateActiveUser(userId: string, previous: typeof users.$inferSelect, data: {
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}) {
  return db.update(users).set({
    email: data.email,
    firstName: data.firstName ?? previous.firstName,
    lastName: data.lastName ?? previous.lastName,
    avatarUrl: data.avatarUrl ?? previous.avatarUrl,
    updatedBy: userId,
    updatedAt: new Date(),
  }).where(and(eq(users.userId, userId), isNull(users.deletedAt)));
}

export async function createUser(userId: string, data: {
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}) {
  await db.insert(users).values({ userId, ...data, createdBy: userId });
}
