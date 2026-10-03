import { NextResponse } from "next/server";
import { useAdminMiddleware as withAdminMiddleware } from "../../_shared/middleware";
import * as loanService from "./loan.service";

export const GET = withAdminMiddleware(async (req, { user }) => {
  const { page, filters } = loanService.parseListQuery(
    req.nextUrl.searchParams,
  );
  const data = await loanService.listLoans(filters, page, user.id);
  return NextResponse.json({ ok: true, data });
});
