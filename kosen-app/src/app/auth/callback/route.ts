import { NextResponse } from "next/server";

/** Keep the previously configured OAuth redirect working during the move. */
export function GET(request: Request) {
  const currentUrl = new URL(request.url);
  const destination = new URL("/api/auth/callback", currentUrl.origin);
  destination.search = currentUrl.search;
  return NextResponse.redirect(destination);
}
