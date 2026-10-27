import { NextResponse } from "next/server";
import { useAdminMiddleware as withAdminMiddleware } from "../_shared/middleware";
import { listUsers, parseListQuery } from "./user.service";

export const GET = withAdminMiddleware(async (req) => {
  const filters = parseListQuery(req.nextUrl.searchParams);
  const data = await listUsers(filters);
  return NextResponse.json({ ok: true, data });
});
