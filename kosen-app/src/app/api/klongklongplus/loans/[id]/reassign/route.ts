import { NextResponse } from "next/server";
import { useAdminMiddleware as withAdminMiddleware } from "../../../../_shared/middleware";
import * as loanService from "../../loan.service";

// "รับช่วงต่อ" — pick up an approved loan that currently has no responsible admin.
export const PATCH = withAdminMiddleware(async (_req, { params, user }) => {
  const loan = await loanService.reassignLoan(params.id, user.id);
  return NextResponse.json({ ok: true, message: "Loan picked up", data: loan });
});
