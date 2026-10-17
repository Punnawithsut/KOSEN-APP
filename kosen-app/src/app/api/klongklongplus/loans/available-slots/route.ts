import { NextResponse } from "next/server";
import { withSessionMiddleware } from "../../../_shared/middleware";
import * as loanService from "../loan.service";

export const GET = withSessionMiddleware(async (req, { user }) => {
  const { unitId, slotDate, excludeLoanId } =
    loanService.parseAvailableSlotsQuery(req.nextUrl.searchParams);
  const data = await loanService.getAvailableSlots(
    user.id,
    unitId,
    slotDate,
    excludeLoanId,
  );
  return NextResponse.json({ ok: true, data });
});
