import { NextResponse } from "next/server";
import { withSessionMiddleware } from "../../../_shared/middleware";
import * as loanService from "../loan.service";

export const GET = withSessionMiddleware(async (req, { user }) => {
  const { page, filters } = loanService.parseMyLoansQuery(
    req.nextUrl.searchParams,
  );
  const data = await loanService.listUserLoans(user.id, page, filters);
  return NextResponse.json({ ok: true, data });
});
