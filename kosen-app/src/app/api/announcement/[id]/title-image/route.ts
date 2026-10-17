import { NextResponse } from "next/server";
import sharp from "sharp";

import { NotFoundError } from "../../../_shared/errors";
import { withSessionMiddleware } from "../../../_shared/middleware";
import { getAnnouncementById } from "../../announcement.repo";
import { downloadAnnouncementFile } from "../../announcement.storage";

/**
 * Serves an announcement's banner at a requested width.
 *
 * Why this exists rather than linking the signed Supabase URL directly:
 *
 *   1. `createSignedUrl` issues a new token per request, so the signed URL
 *      changes on every list fetch. Browsers cannot cache a URL that never
 *      repeats, so every visit re-downloaded every image at full size. This
 *      route's URL is stable, so it caches properly.
 *   2. A phone was downloading the full-size original for a ~400px thumbnail.
 *      With a `w` hint the bytes actually match the slot.
 *
 * Only the three widths the UI asks for are accepted — an open-ended `w` would
 * let anyone make the server re-encode arbitrary sizes on demand.
 */

const ALLOWED_WIDTHS = new Set<number>([400, 800, 1600]);
const DEFAULT_WIDTH = 800;

/** Formats sharp can re-encode. Anything else (SVG, GIF) streams through. */
const RESIZABLE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

type AnnouncementParams = { id: string };

export const GET = withSessionMiddleware<AnnouncementParams>(
  async (req, { params }) => {
    const announcement = await getAnnouncementById(params.id);

    // `titleImageUrl` still holds the raw storage path at this layer; the API
    // only resolves it to a signed URL when serialising.
    if (!announcement?.titleImageUrl) {
      throw new NotFoundError("This announcement has no title image.");
    }

    const requested = Number(req.nextUrl.searchParams.get("w"));
    const width = ALLOWED_WIDTHS.has(requested) ? requested : DEFAULT_WIDTH;

    const original = await downloadAnnouncementFile(announcement.titleImageUrl);

    const canResize = RESIZABLE_TYPES.has(original.contentType);

    // `withoutEnlargement` matters: a 300px-wide upload must not be upscaled to
    // 1600 just because the srcset asked for it — that would ship more bytes
    // than the original and look worse doing it.
    const body = canResize
      ? await sharp(original.data)
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 78 })
          .toBuffer()
      : original.data;

    const contentType = canResize ? "image/webp" : original.contentType;

    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": contentType,
        // `private`: the route is behind a session, so only the browser may
        // cache it. `stale-while-revalidate` keeps navigation instant while
        // still letting a replaced banner correct itself.
        "Cache-Control": "private, max-age=300, stale-while-revalidate=86400",
        "Content-Length": String(body.byteLength),
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
);
