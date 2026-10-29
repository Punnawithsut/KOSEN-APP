import { NextResponse } from "next/server";
import { withSessionMiddleware } from "../../_shared/middleware";
import { fetchAvatarImage } from "../profile.service";

export const GET = withSessionMiddleware(async (_request, { user }) => {
  const image = await fetchAvatarImage(user.id);
  if (!image) return new NextResponse(null, { status: 404 });
  return new NextResponse(image.body, {
    headers: {
      "Cache-Control": "private, max-age=86400, stale-while-revalidate=604800",
      "Content-Type": image.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
});
