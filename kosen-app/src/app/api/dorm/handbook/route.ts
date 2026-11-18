import { NextResponse } from "next/server";
import { useAdminMiddleware as withAdmin, withSessionMiddleware } from "../../_shared/middleware";
import { AppError } from "../../_shared/errors";
import { getHandbookUrl, removeHandbook, replaceHandbook } from "./handbook.service";

export const GET = withSessionMiddleware(async (request) => {
  const download = request.nextUrl.searchParams.get("download") === "1";
  const signedUrl = await getHandbookUrl(download);
  if (download) return NextResponse.redirect(signedUrl);

  const response = await fetch(signedUrl, { cache: "no-store" });
  if (!response.ok || !response.body) {
    throw new AppError("Unable to access handbook.", 502);
  }

  const headers = new Headers({
    "Content-Type": response.headers.get("content-type") ?? "application/pdf",
    "Content-Disposition": "inline",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  const contentLength = response.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);

  return new NextResponse(response.body, { headers });
});

export const POST = withAdmin(async (request, { user }) => {
  const formData = await request.formData();
  const data = await replaceHandbook(formData.get("file"), formData.get("edition"), formData.get("pages"), user.id);
  return NextResponse.json({ ok: true, data });
});

export const DELETE = withAdmin(async () => {
  await removeHandbook();
  return NextResponse.json({ ok: true, message: "Handbook file deleted." });
});
