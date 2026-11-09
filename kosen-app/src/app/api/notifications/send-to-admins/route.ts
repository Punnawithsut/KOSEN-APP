import { NextResponse } from "next/server";
import {
  parseJsonBody,
  withSessionMiddleware,
} from "@/app/api/_shared/middleware";
import { sendNotificationsToAdmins } from "../notification.service";

export const POST = withSessionMiddleware(async (request, { user }) => {
  const result = await sendNotificationsToAdmins(
    await parseJsonBody<unknown>(request),
    user.id,
  );
  return NextResponse.json(result.body, { status: result.status });
});
