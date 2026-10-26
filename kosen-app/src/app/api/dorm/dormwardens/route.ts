import { NextResponse } from "next/server";
import {
  useAdminMiddleware as withAdminMiddleware,
  withSessionMiddleware,
} from "../../_shared/middleware";
import * as wardensService from "./dormwardens.service";

export const GET = withSessionMiddleware(async (req) => {
  const { page, filters } = wardensService.parseListQuery(
    req.nextUrl.searchParams,
  );
  const data = await wardensService.listWardens(page, filters);
  return NextResponse.json({ ok: true, data });
});

export const POST = withAdminMiddleware(async (req, { user }) => {
  const created = await wardensService.createWarden(user.id, await req.json());
  return NextResponse.json(
    {
      ok: true,
      message: "Warden created successfully",
      data: created,
    },
    { status: 201 },
  );
});
