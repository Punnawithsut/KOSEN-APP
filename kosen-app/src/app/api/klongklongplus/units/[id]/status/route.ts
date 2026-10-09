import { NextResponse } from "next/server";
import {
  useAdminMiddleware as withAdminMiddleware,
  parseJsonBody,
} from "../../../../_shared/middleware";
import * as unitService from "../../unit.service";

export const PATCH = withAdminMiddleware(async (req, { params }) => {
  const body = await parseJsonBody<unknown>(req);
  const status = unitService.parseStatusBody(body);
  const unit = await unitService.updateUnitStatus(params.id, status);
  return NextResponse.json({ ok: true, data: unit });
});
