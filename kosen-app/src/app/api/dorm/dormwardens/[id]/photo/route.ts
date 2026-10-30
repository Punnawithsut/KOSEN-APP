import { NextResponse } from "next/server";
import { useAdminMiddleware as withAdmin, withSessionMiddleware } from "../../../../_shared/middleware";
import { getWardenPhotoUrl, removeWardenPhoto, uploadWardenPhoto } from "../../photo.service";
import { fetchWarden } from "../../dormwardens.service";

type Params = { id: string };

export const GET = withSessionMiddleware<Params>(async (_request, { params }) => {
  await fetchWarden(params.id);
  return NextResponse.redirect(await getWardenPhotoUrl(params.id));
});

export const POST = withAdmin<Params>(async (request, { params }) => {
  await fetchWarden(params.id);
  await uploadWardenPhoto(params.id, (await request.formData()).get("file"));
  return NextResponse.json({ ok: true, message: "Staff photo updated." });
});

export const DELETE = withAdmin<Params>(async (_request, { params }) => {
  await removeWardenPhoto(params.id);
  return NextResponse.json({ ok: true, message: "Staff photo deleted." });
});
