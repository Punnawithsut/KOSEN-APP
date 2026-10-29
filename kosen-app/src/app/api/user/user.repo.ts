import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export type UserNotificationTarget = {
  userId: string;
  studentId: string | null;
};

export type UserListFilters = {
  department?: string;
  year?: number;
  dormBuilding?: string;
  dormRoom?: string;
};

export async function findUserIdByFilters(filters: UserListFilters): Promise<UserNotificationTarget[]> {
  return db
    .select({
      userId: users.userId,
      studentId: users.studentId,
    })
    .from(users)
    .where(and(
      filters.department ? eq(users.department, filters.department) : undefined,
      filters.year !== undefined ? eq(users.year, filters.year) : undefined,
      filters.dormBuilding ? eq(users.dormBuilding, filters.dormBuilding) : undefined,
      filters.dormRoom ? eq(users.dormRoom, filters.dormRoom) : undefined,
      isNull(users.deletedAt),
    ));
}
