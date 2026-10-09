import { NextResponse } from "next/server";
import { useAdminMiddleware as withAdminMiddleware } from "../../../../_shared/middleware";
import * as loanService from "../../loan.service";

// "ปล่อยงาน" — the responsible admin steps back; see reassign/route.ts for "รับช่วงต่อ".
export const PATCH = withAdminMiddleware(async (_req, { params, user }) => {
  const loan = await loanService.releaseLoan(params.id, user.id);
  return NextResponse.json({
    ok: true,
    message: "Loan released back to the queue",
    data: loan,
  });
});
