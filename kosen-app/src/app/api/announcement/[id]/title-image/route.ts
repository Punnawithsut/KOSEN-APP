import { NextResponse } from "next/server";
import { withSessionMiddleware } from "../../../_shared/middleware";
import { getAnnouncementTitleImage } from "../../announcement.service";

type AnnouncementParams = { id: string };

export const GET = withSessionMiddleware<AnnouncementParams>(async (request, { params }) => {
  const image = await getAnnouncementTitleImage(params.id, Number(request.nextUrl.searchParams.get("w")));
  return new NextResponse(new Uint8Array(image.body), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "private, max-age=300, stale-while-revalidate=86400",
      "Content-Length": String(image.body.byteLength),
      "X-Content-Type-Options": "nosniff",
    },
  });
});
