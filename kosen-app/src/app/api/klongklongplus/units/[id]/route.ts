import { NextResponse } from "next/server";
import {
  useAdminMiddleware as withAdminMiddleware,
  parseJsonBody,
} from "../../../_shared/middleware";
import * as unitService from "../unit.service";

export const PUT = withAdminMiddleware(async (req, { params }) => {
  const body = await parseJsonBody<unknown>(req);
  const data = unitService.parseUpdateUnitData(body);
  const unit = await unitService.updateUnitById(params.id, data);
  return NextResponse.json({ ok: true, data: unit });
});

export const DELETE = withAdminMiddleware(async (_req, { params }) => {
  await unitService.deleteUnitById(params.id);
  return NextResponse.json({
    ok: true,
    message: "Unit deleted successfully",
  });
});
