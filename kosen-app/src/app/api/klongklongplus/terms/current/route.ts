import { NextResponse } from "next/server";
import { withSessionMiddleware } from "../../../_shared/middleware";
import * as termService from "../term.service";

export const GET = withSessionMiddleware(async () => {
  const term = await termService.getCurrentTerm();
  return NextResponse.json({
    ok: true,
    data: termService.serializeTermDates(term),
  });
});
