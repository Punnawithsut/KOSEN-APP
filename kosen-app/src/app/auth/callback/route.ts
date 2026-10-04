import { createClient } from "@/lib/supabase/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const email = data.user.email ?? "";
      const normalizedEmail = email.trim().toLowerCase();
      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      if (
        !normalizedEmail.endsWith("@kmitl.ac.th") &&
        normalizedEmail !== adminEmail
      ) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=unauthorized_email`);
      }

      await db
        .insert(users)
        .values({ userId: data.user.id, email })
        .onConflictDoNothing();

      return NextResponse.redirect(`${origin}/announcement`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
