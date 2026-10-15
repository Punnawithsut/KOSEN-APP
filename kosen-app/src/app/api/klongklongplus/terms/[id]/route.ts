import { NextResponse } from "next/server";
import {
  parseJsonBody,
  useAdminMiddleware as withAdminMiddleware,
} from "../../../_shared/middleware";
import * as termService from "../term.service";

export const GET = withAdminMiddleware(
  async (_req, { params }) => {
    const term = await termService.getTerm(params.id);
    return NextResponse.json({
      ok: true,
      data: termService.serializeTermDates(term),
    });
  },
);

export const PUT = withAdminMiddleware(
  async (req, { params, user }) => {
    const body = await parseJsonBody<unknown>(req);
    const data = termService.parseUpdateTerm(body);
    const term = await termService.updateTerm(params.id, data, user.id);
    return NextResponse.json({
      ok: true,
      message: "Term updated successfully",
      data: termService.serializeTermDates(term),
    });
  },
);

export const DELETE = withAdminMiddleware(
  async (_req, { params, user }) => {
    await termService.deleteTerm(params.id, user.id);
    return NextResponse.json({
      ok: true,
      message: "Term soft-deleted successfully",
    });
  },
);
