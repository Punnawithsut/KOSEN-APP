import { NextResponse } from "next/server";
import { withSessionMiddleware, parseJsonBody } from "../_shared/middleware";
import * as profileService from "./profile.service";
import type { UpdateProfileData } from "./profile.repo";

// GET /api/profile -> Returns current user profile
export const GET = withSessionMiddleware(async (req, { user }) => {
  const profile = await profileService.fetchUserProfile(user.id);
  return NextResponse.json({ ok: true, data: profile });
});

// PATCH /api/profile -> Updates allowed user fields
export const PATCH = withSessionMiddleware(async (req, { user }) => {
  const body = await parseJsonBody<Record<string, unknown>>(req);

  const safeUpdateData: UpdateProfileData = {};

  if (typeof body.studentId === "string") safeUpdateData.studentId = body.studentId;
  if (typeof body.firstName === "string") safeUpdateData.firstName = body.firstName;
  if (typeof body.lastName === "string") safeUpdateData.lastName = body.lastName;
  if (typeof body.phone === "string") safeUpdateData.phone = body.phone;
  if (typeof body.department === "string") safeUpdateData.department = body.department;
  if (typeof body.year === "number") safeUpdateData.year = body.year;
  if (typeof body.dormBuilding === "string" || typeof body.dormBuilding === "number") {
    safeUpdateData.dormBuilding = String(body.dormBuilding);
  }
  if (typeof body.dormRoom === "string") safeUpdateData.dormRoom = body.dormRoom;

  const updatedProfile = await profileService.modifyUserProfile(user.id, safeUpdateData);

  return NextResponse.json({
    ok: true,
    message: "Profile updated successfully",
    data: updatedProfile,
  });
});