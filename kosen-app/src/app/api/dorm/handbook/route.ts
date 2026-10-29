import { NextResponse } from "next/server";
import { withSessionMiddleware } from "../../_shared/middleware";

/**
 * GET /api/dorm/handbook
 *
 * Simple download proxy for the dorm handbook PDF.
 * Fetches the PDF from a steady URL (DORM_HANDBOOK_URL env var) and streams it
 * back as an attachment so the browser downloads it instead of navigating to it.
 *
 * Any authenticated user can download it.
 */
export const GET = withSessionMiddleware(async () => {
  const handbookUrl = process.env.DORM_HANDBOOK_URL;

  if (!handbookUrl) {
    return NextResponse.json(
      { ok: false, error: "DORM_HANDBOOK_URL is not configured." },
      { status: 500 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(handbookUrl, { cache: "no-store" });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to reach the handbook file." },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { ok: false, error: "Handbook file is not available." },
      { status: 502 },
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "application/pdf"; //Can be change if not pdf
  const buffer = await upstream.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": 'attachment; filename="dorm-handbook.pdf"',
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
});
