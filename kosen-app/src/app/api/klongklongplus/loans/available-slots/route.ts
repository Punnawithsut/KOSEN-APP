import { NextResponse } from "next/server";
import { withSessionMiddleware } from "../../../_shared/middleware";
import * as loanService from "../loan.service";

export const GET = withSessionMiddleware(async (req) => {
  const { unitId, slotDate } = loanService.parseAvailableSlotsQuery(
    req.nextUrl.searchParams,
  );
  const data = await loanService.getAvailableSlots(unitId, slotDate);
  return NextResponse.json({ ok: true, data });
});
