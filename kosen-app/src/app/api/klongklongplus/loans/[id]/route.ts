import { NextResponse } from "next/server";
import {
  parseJsonBody,
  withSessionMiddleware,
} from "../../../_shared/middleware";
import * as loanService from "../loan.service";

export const PUT = withSessionMiddleware(async (req, { params, user }) => {
  const body = await parseJsonBody<unknown>(req);
  const data = loanService.parseUpdateUserLoanData(body);
  const loan = await loanService.updateUserLoan(params.id, user.id, data);
  return NextResponse.json({
    ok: true,
    message: "Loan request updated",
    data: loan,
  });
});

export const DELETE = withSessionMiddleware(async (_req, { params, user }) => {
  await loanService.deleteUserLoan(params.id, user.id);
  return NextResponse.json({
    ok: true,
    message: "Loan request deleted",
  });
});
