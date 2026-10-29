import {
  getUserById,
  updateUserById,
  type UpdateProfileData,
} from "./profile.repo";
import { AppError, NotFoundError, BadRequestError } from "../_shared/errors";

export type { UpdateProfileData } from "./profile.repo";

const ALLOWED_DEPARTMENTS = [
  "Computer Engineering",
  "Mechatronics Engineering",
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

export async function fetchAvatarUrl(userId: string) {
  const user = await getUserById(userId);
  return user?.avatarUrl ?? null;
}

export async function fetchAvatarImage(userId: string) {
  const value = await fetchAvatarUrl(userId);
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new AppError("Invalid profile image URL.", 502);
  }
  if (url.protocol !== "https:" || !/(^|\.)googleusercontent\.com$/i.test(url.hostname)) {
    throw new AppError("Unsupported profile image source.", 502);
  }
  const response = await fetch(url, { cache: "force-cache", headers: { Accept: "image/*" }, redirect: "error" });
  if (!response.ok) throw new AppError(`Profile image provider returned ${response.status}.`, 502);
  const contentType = response.headers.get("content-type");
  if (!contentType?.startsWith("image/")) throw new AppError("Profile image provider returned a non-image response.", 502);
  return { body: response.body, contentType };
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
  if (data.studentId && data.studentId.length != 8) {
    throw new BadRequestError(
      "Student ID exceeds maximum length of 8 characters.",
    );
  }

  if (data.phone && data.phone.length != 10) {
    throw new BadRequestError(
      "Phone number exceeds maximum length of 10 characters.",
    );
  }

  if (data.dormRoom && data.dormRoom.length > 50) {
    throw new BadRequestError(
      "Dorm room exceeds maximum length of 50 characters.",
    );
  }

  const updatedUser = await updateUserById(userId, data, userId);

  if (!updatedUser) {
    throw new NotFoundError("Failed to update: User profile not found.");
  }

  return updatedUser;
}
