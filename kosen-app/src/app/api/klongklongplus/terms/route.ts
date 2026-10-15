import { NextResponse } from "next/server";
import {
  parseJsonBody,
  useAdminMiddleware as withAdminMiddleware,
} from "../../_shared/middleware";
import * as termService from "./term.service";

export const GET = withAdminMiddleware(async (req) => {
  const { page, filters } = termService.parseListQuery(req.nextUrl.searchParams);
  const data = await termService.listTerms(page, filters.search);
  return NextResponse.json({ ok: true, data });
});

export const POST = withAdminMiddleware(async (req, { user }) => {
  const body = await parseJsonBody<unknown>(req);
  const data = termService.parseCreateTerm(body);
  const term = await termService.createTerm(data, user.id);
  return NextResponse.json(
    { ok: true, message: "Term created successfully", data: term },
    { status: 201 },
  );
});
