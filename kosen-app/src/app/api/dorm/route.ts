import { NextResponse } from "next/server";
import { withSessionMiddleware } from "../_shared/middleware";
import { getDormDashboard } from "./dorm.service";

export const GET = withSessionMiddleware(async () => {
  const data = await getDormDashboard();
  return NextResponse.json({ ok: true, data });
});
