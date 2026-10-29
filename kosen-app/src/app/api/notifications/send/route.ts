import { NextResponse } from "next/server";
import { parseJsonBody, useAdminMiddleware as withAdminMiddleware } from "@/app/api/_shared/middleware";
import { sendNotifications } from "../notification.service";

export const POST = withAdminMiddleware(async (request) => {
  const result = await sendNotifications(await parseJsonBody<unknown>(request));
  return NextResponse.json(result.body, { status: result.status });
});
