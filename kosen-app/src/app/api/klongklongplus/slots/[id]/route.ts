import { NextResponse } from "next/server";
import {
  parseJsonBody,
  useAdminMiddleware as withAdminMiddleware,
} from "../../../_shared/middleware";
import * as slotService from "../slot.service";

export const GET = withAdminMiddleware(
  async (_req, { params }) => {
    const slot = await slotService.getSlot(params.id);
    return NextResponse.json({ ok: true, data: slot });
  },
);

export const PUT = withAdminMiddleware(
  async (req, { params, user }) => {
    const body = await parseJsonBody<unknown>(req);
    const data = slotService.parseUpdateSlot(body);
    const slot = await slotService.updateSlot(params.id, data, user.id);
    return NextResponse.json({
      ok: true,
      message: "Slot updated successfully",
      data: slot,
    });
  },
);

export const DELETE = withAdminMiddleware(
  async (_req, { params, user }) => {
    await slotService.deleteSlot(params.id, user.id);
    return NextResponse.json({
      ok: true,
      message: "Slot soft-deleted successfully",
    });
  },
);
