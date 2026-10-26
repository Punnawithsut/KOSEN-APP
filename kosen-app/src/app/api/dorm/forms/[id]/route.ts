import { NextResponse } from "next/server";
import {
  useAdminMiddleware as withAdminMiddleware,
  withSessionMiddleware,
} from "../../../_shared/middleware";
import * as formsService from "../forms.service";

type FormParams = { id: string };

export const GET = withSessionMiddleware<FormParams>(
  async (_req, { params }) => {
    const form = await formsService.fetchForm(params.id);
    return NextResponse.json({ ok: true, data: form });
  },
);

export const PUT = withAdminMiddleware<FormParams>(
  async (req, { params, user }) => {
    const form = await formsService.modifyForm(params.id, user.id, await req.json());
    return NextResponse.json({
      ok: true,
      message: "Form updated successfully",
      data: form,
    });
  },
);

export const DELETE = withAdminMiddleware<FormParams>(
  async (_req, { params, user }) => {
    await formsService.removeForm(params.id, user.id);
    return NextResponse.json({
      ok: true,
      message: "Form soft-deleted successfully",
    });
  },
);
