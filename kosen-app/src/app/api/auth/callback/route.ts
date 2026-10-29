import { NextResponse } from "next/server";
import { completeAuthCallback } from "./callback.service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectPath = await completeAuthCallback(url.searchParams.get("code"));
  return NextResponse.redirect(new URL(redirectPath, url.origin));
}
