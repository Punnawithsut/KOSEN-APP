import { NextResponse } from "next/server";
import { useAdminMiddleware as withAdminMiddleware } from "../../../../_shared/middleware";
import * as loanService from "../../loan.service";

export const PATCH = withAdminMiddleware(async (req, { params, user }) => {
  // Body is optional here (condition note only), so a missing/empty body is fine.
  const body = await req.json().catch(() => ({}));
  const conditionIn = loanService.parseConditionBody(body);
  const loan = await loanService.returnLoan(params.id, user.id, conditionIn);
  return NextResponse.json({
    ok: true,
    message: "Loan marked as returned",
    data: loan,
  });
});
