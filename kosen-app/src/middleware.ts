import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  try {
    await supabase.auth.getUser();
  } catch (error) {
    console.log(error);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on every request except static assets and image optimization files —
     * no point refreshing auth cookies for a .png or a JS chunk.
     *
     * `/api` is excluded too. Every API route builds its own Supabase client in
     * `_shared/middleware.ts` and refreshes its own cookies through
     * `next/headers`, so running here only duplicates a `getUser()` round trip
     * (visible as the `proxy.ts` line in the request log) and puts the request
     * body through the middleware request-forwarding path — which is not worth
     * risking on multipart uploads.
     */
    "/((?!_next/static|_next/image|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
