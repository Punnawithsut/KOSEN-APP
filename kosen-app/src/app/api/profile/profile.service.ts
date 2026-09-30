import {
  getUserById,
  updateUserById,
  type UpdateProfileData,
} from "./profile.repo";
import { NotFoundError, BadRequestError } from "../_shared/errors";

const ALLOWED_DEPARTMENTS = [
  "Computer Engineering",
  "Mechanical Engineering",
  "Electrical and Electronics Engineering",
] as const;

const ALLOWED_DORM_BUILDINGS = ["7", "8"] as const;

export async function fetchUserProfile(userId: string) {
  const user = await getUserById(userId);

  if (!user) {
    throw new NotFoundError("User profile not found.");
  }

  return user;
}

export async function modifyUserProfile(
  userId: string,
  data: UpdateProfileData,
) {
  if (Object.keys(data).length === 0) {
    throw new BadRequestError("No valid update fields provided.");
  }

  // Validation: Department
  if (
    data.department !== undefined &&
    !ALLOWED_DEPARTMENTS.includes(
      data.department as (typeof ALLOWED_DEPARTMENTS)[number],
    )
  ) {
    throw new BadRequestError(
      `Department must be one of: ${ALLOWED_DEPARTMENTS.join(", ")}`,
    );
  }

  // Validation: Academic Year (1-5)
  if (data.year !== undefined) {
    if (!Number.isInteger(data.year) || data.year < 1 || data.year > 5) {
      throw new BadRequestError("Year must be an integer between 1 and 5.");
    }
  }

  // Validation: Dorm Building (7 or 8)
  if (
    data.dormBuilding !== undefined &&
    !ALLOWED_DORM_BUILDINGS.includes(
      data.dormBuilding as (typeof ALLOWED_DORM_BUILDINGS)[number],
    )
  ) {
    throw new BadRequestError("Dorm building can only be '7' or '8'.");
  }

  // Validation: String lengths matching DB constraints
  if (data.studentId && data.studentId.length > 8) {
    throw new BadRequestError(
      "Student ID exceeds maximum length of 8 characters.",
    );
  }

  if (data.phone && data.phone.length > 10) {
    throw new BadRequestError(
      "Phone number exceeds maximum length of 10 characters.",
    );
  }

  if (data.dormRoom && data.dormRoom.length > 50) {
    throw new BadRequestError(
      "Dorm room exceeds maximum length of 50 characters.",
    );
  }

  const updatedUser = await updateUserById(userId, data);

  if (!updatedUser) {
    throw new NotFoundError("Failed to update: User profile not found.");
  }

  return updatedUser;
}
