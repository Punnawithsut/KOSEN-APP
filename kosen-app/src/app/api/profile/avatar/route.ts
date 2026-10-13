import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { withSessionMiddleware } from "../../_shared/middleware";

const GOOGLE_AVATAR_HOST = /(^|\.)googleusercontent\.com$/i;

export const GET = withSessionMiddleware(async (_req, { user }) => {
  const profile = await db.query.users.findFirst({
    where: eq(users.userId, user.id),
    columns: { avatarUrl: true },
  });

  if (!profile?.avatarUrl) {
    return new NextResponse(null, { status: 404 });
  }

  let avatarUrl: URL;
  try {
    avatarUrl = new URL(profile.avatarUrl);
  } catch {
    return NextResponse.json(
      { error: "Invalid profile image URL." },
      { status: 502 },
    );
  }

  if (
    avatarUrl.protocol !== "https:" ||
    !GOOGLE_AVATAR_HOST.test(avatarUrl.hostname)
  ) {
    return NextResponse.json(
      { error: "Unsupported profile image source." },
      { status: 502 },
    );
  }

  const image = await fetch(avatarUrl, {
    cache: "force-cache",
    headers: { Accept: "image/*" },
    redirect: "error",
  });

  if (!image.ok) {
    return NextResponse.json(
      { error: `Profile image provider returned ${image.status}.` },
      { status: 502 },
    );
  }

  const contentType = image.headers.get("content-type");
  if (!contentType?.startsWith("image/")) {
    return NextResponse.json(
      { error: "Profile image provider returned a non-image response." },
      { status: 502 },
    );
  }

  return new NextResponse(image.body, {
    headers: {
      "Cache-Control": "private, max-age=86400, stale-while-revalidate=604800",
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
});
