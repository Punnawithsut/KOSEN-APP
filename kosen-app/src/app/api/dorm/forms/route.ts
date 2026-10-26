import { NextResponse } from "next/server";
import {
  useAdminMiddleware as withAdminMiddleware,
  withSessionMiddleware,
} from "../../_shared/middleware";
import * as formsService from "./forms.service";



export const GET = withSessionMiddleware(async (req) => {
  const { page, filters } = formsService.parseListQuery(
    req.nextUrl.searchParams,
  );
  const data = await formsService.listForms(page, filters);
  return NextResponse.json({ ok: true, data });
});



export const POST = withAdminMiddleware(async (req, { user }) => {
  const created = await formsService.createForm(user.id, await req.json());
  return NextResponse.json(
    {
      ok: true,
      message: "Form created successfully",
      data: created,
    },
    { status: 201 },
  );
});
