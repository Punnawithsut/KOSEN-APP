import { eq } from "drizzle-orm";
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
    where: eq(users.userId, userId),
  });
}

export async function updateUserById(userId: string, data: UpdateProfileData) {
  const [updatedUser] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.userId, userId))
    .returning();

  return updatedUser;
}