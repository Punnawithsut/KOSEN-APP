import { NextResponse } from "next/server";
import { withSessionMiddleware } from "../../../_shared/middleware";
import * as loanService from "../loan.service";

export const GET = withSessionMiddleware(async (req, { user }) => {
  const requestedPage = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const page = Number.isInteger(requestedPage)
    ? Math.max(1, requestedPage)
    : 1;
  const data = await loanService.listUserLoans(user.id, page);
  return NextResponse.json({ ok: true, data });
});
