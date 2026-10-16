import { NextResponse } from "next/server";
import { parsePageQuery } from "../../../_shared/pagination";
import { withSessionMiddleware } from "../../../_shared/middleware";
import { PAGE_SIZE } from "../loan.repo";
import * as loanService from "../loan.service";

export const GET = withSessionMiddleware(async (req, { user }) => {
  const page = parsePageQuery(req.nextUrl.searchParams, {
    pageSize: PAGE_SIZE,
  });
  const data = await loanService.listUserLoans(user.id, page);
  return NextResponse.json({ ok: true, data });
});
