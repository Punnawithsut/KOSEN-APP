import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export type UpdateProfileData = {
  studentId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  year?: number;
  dormBuilding?: string;
  dormRoom?: string;
};

export async function getUserById(userId: string) {
  return await db.query.users.findFirst({
    where: and(eq(users.userId, userId), isNull(users.deletedAt)),
  });
}

export async function updateUserById(
  userId: string,
  data: UpdateProfileData,
  updatedBy: string,
) {
  const [updatedUser] = await db
    .update(users)
    .set({
      ...data,
      updatedBy,
      updatedAt: new Date(),
    })
    .where(and(eq(users.userId, userId), isNull(users.deletedAt)))
    .returning();

  return updatedUser;
}