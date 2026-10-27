import { NextResponse } from "next/server";
import {
  useAdminMiddleware as withAdminMiddleware,
  withSessionMiddleware,
} from "../../../_shared/middleware";
import * as wardensService from "../dormwardens.service";

type WardenParams = { id: string };

export const GET = withSessionMiddleware<WardenParams>(
  async (_req, { params }) => {
    const warden = await wardensService.fetchWarden(params.id);
    return NextResponse.json({ ok: true, data: warden });
  },
);

export const PUT = withAdminMiddleware<WardenParams>(
  async (req, { params, user }) => {
    const warden = await wardensService.modifyWarden(
      params.id,
      user.id,
      await req.json(),
    );
    return NextResponse.json({
      ok: true,
      message: "Warden updated successfully",
      data: warden,
    });
  },
);

export const DELETE = withAdminMiddleware<WardenParams>(
  async (_req, { params, user }) => {
    await wardensService.removeWarden(params.id, user.id);
    return NextResponse.json({
      ok: true,
      message: "Warden soft-deleted successfully",
    });
  },
);
