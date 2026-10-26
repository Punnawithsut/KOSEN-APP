import { and, isNull, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export type UserNotificationTarget = {
  userId: string;
  studentId: string | null;
};

export async function findUserIdByFilters(
  where: SQL | undefined,
): Promise<UserNotificationTarget[]> {
  return db
    .select({
      userId: users.userId,
      studentId: users.studentId,
    })
    .from(users)
    .where(and(where, isNull(users.deletedAt)));
}
