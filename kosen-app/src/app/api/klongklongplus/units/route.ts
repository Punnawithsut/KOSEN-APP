import { NextResponse } from "next/server";
import {
  useAdminMiddleware as withAdminMiddleware,
  parseJsonBody,
} from "../../_shared/middleware";
import * as unitService from "./unit.service";

export const GET = withAdminMiddleware(async (req) => {
  const { page, filters } = unitService.parseListQuery(
    req.nextUrl.searchParams,
  );
  const data = await unitService.listUnits(filters, page);
  return NextResponse.json({ ok: true, data });
});

export const POST = withAdminMiddleware(async (req) => {
  const body = await parseJsonBody<unknown>(req);
  const data = unitService.parseCreateUnitData(body);
  const unit = await unitService.createUnit(data);
  return NextResponse.json(
    { ok: true, message: "Unit created successfully", data: unit },
    { status: 201 },
  );
});
