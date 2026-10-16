import { NextResponse } from "next/server";
import {
  parseJsonBody,
  useAdminMiddleware as withAdminMiddleware,
  withNonAdminSessionMiddleware,
} from "../../_shared/middleware";
import * as loanService from "./loan.service";

export const POST = withNonAdminSessionMiddleware(async (req, { user }) => {
  const body = await parseJsonBody<unknown>(req);
  const data = loanService.parseCreateUserLoanData(body);
  const loan = await loanService.createUserLoan(user.id, data);
  return NextResponse.json(
    { ok: true, message: "Loan request created", data: loan },
    { status: 201 },
  );
});

export const GET = withAdminMiddleware(async (req, { user }) => {
  const { page, filters } = loanService.parseListQuery(
    req.nextUrl.searchParams,
  );
  const data = await loanService.listLoans(filters, page, user.id);
  return NextResponse.json({ ok: true, data });
});
