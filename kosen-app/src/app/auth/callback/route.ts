import { createClient } from "@/lib/supabase/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

function getGoogleAvatarUrl(user: { user_metadata?: Record<string, unknown> }) {
  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    (user.user_metadata?.profile_image as string | undefined) ??
    null;

  return avatarUrl?.trim() ? avatarUrl : null;
}

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
      const avatarUrl = getGoogleAvatarUrl(data.user);

      if (
        !normalizedEmail.endsWith("@kmitl.ac.th") &&
        normalizedEmail !== adminEmail
      ) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=unauthorized_email`);
      }

      const existingUser = await db.query.users.findFirst({
        where: eq(users.userId, data.user.id),
      });

      if (existingUser) {
        await db
          .update(users)
          .set({
            email,
            avatarUrl: avatarUrl ?? existingUser.avatarUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.userId, data.user.id));
      } else {
        await db.insert(users).values({
          userId: data.user.id,
          email,
          avatarUrl,
        });
      }

      return NextResponse.redirect(`${origin}/announcement`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
