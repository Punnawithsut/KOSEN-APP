import { NextResponse } from "next/server";
import {
  useAdminMiddleware as withAdminMiddleware,
  parseJsonBody,
} from "../../../../_shared/middleware";
import * as loanService from "../../loan.service";

export const PATCH = withAdminMiddleware(async (req, { params, user }) => {
  const body = await parseJsonBody<{ reason?: string }>(req);
  const reason = loanService.parseReasonBody(body);
  const loan = await loanService.cancelLoanByAdmin(params.id, user.id, reason);
  return NextResponse.json({
    ok: true,
    message: "Loan cancelled",
    data: loan,
  });
});
