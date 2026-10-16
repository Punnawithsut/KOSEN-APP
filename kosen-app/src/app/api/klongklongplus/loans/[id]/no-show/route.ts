import { NextResponse } from "next/server";
import { useAdminMiddleware as withAdminMiddleware } from "../../../../_shared/middleware";
import * as loanService from "../../loan.service";

export const PATCH = withAdminMiddleware(async (_req, { params, user }) => {
  const loan = await loanService.markNoShow(params.id, user.id);
  return NextResponse.json({
    ok: true,
    message: "Loan marked as no-show",
    data: loan,
  });
});
