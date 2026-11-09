import { NextResponse } from "next/server";
import { useAdminMiddleware as withAdminMiddleware } from "../../../../_shared/middleware";
import * as loanService from "../../loan.service";

export const DELETE = withAdminMiddleware(async (_req, { params, user }) => {
  await loanService.deleteAdminLoan(params.id, user.id);
  return NextResponse.json({
    ok: true,
    message: "Loan deleted",
  });
});
