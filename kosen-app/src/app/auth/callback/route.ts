import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const email = data.user.email ?? "";
      if (!email.endsWith("@kmitl.ac.th")) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=not_kmitl_domain`);
      }
      // Success page for this dummy test — swap for your real homepage later
      return NextResponse.redirect(`${origin}/whoami`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}