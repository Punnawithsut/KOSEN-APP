import { NextResponse } from "next/server";
import {
  parseJsonBody,
  useAdminMiddleware as withAdminMiddleware,
} from "../../_shared/middleware";
import * as slotService from "./slot.service";

export const GET = withAdminMiddleware(async (req) => {
  const { page, filters } = slotService.parseListQuery(req.nextUrl.searchParams);
  const data = await slotService.listSlots(page, filters);
  return NextResponse.json({ ok: true, data });
});

export const POST = withAdminMiddleware(async (req, { user }) => {
  const body = await parseJsonBody<unknown>(req);
  const data = slotService.parseCreateSlot(body);
  const slot = await slotService.createSlot(data, user.id);
  return NextResponse.json(
    { ok: true, message: "Slot created successfully", data: slot },
    { status: 201 },
  );
});
