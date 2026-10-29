import { NextResponse } from "next/server";
import { useAdminMiddleware as withAdmin, withSessionMiddleware } from "../../_shared/middleware";
import { getHandbookUrl, replaceHandbook } from "./handbook.service";

export const GET = withSessionMiddleware(async (request) => {
  const signedUrl = await getHandbookUrl(request.nextUrl.searchParams.get("download") === "1");
  return NextResponse.redirect(signedUrl);
});

export const POST = withAdmin(async (request, { user }) => {
  const formData = await request.formData();
  const data = await replaceHandbook(formData.get("file"), formData.get("edition"), formData.get("pages"), user.id);
  return NextResponse.json({ ok: true, data });
});
