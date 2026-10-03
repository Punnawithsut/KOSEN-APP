import { NextResponse } from "next/server";
import { useAdminMiddleware as withAdminMiddleware } from "../../../../_shared/middleware";
import * as loanService from "../../loan.service";

export const PATCH = withAdminMiddleware(async (req, { params, user }) => {
  // Body is optional here (condition note only), so a missing/empty body is fine.
  const body = await req.json().catch(() => ({}));
  const conditionOut = loanService.parseConditionBody(body);
  const loan = await loanService.deliverLoan(params.id, user.id, conditionOut);
  return NextResponse.json({
    ok: true,
    message: "Loan marked as delivered",
    data: loan,
  });
});
