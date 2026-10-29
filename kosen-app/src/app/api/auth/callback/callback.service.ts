import { createClient } from "@/lib/supabase/server";
import { createUser, findUserByAuthId, updateActiveUser } from "./callback.repo";

type AuthMetadataUser = { id: string; email?: string; user_metadata?: Record<string, unknown> };

function metadataText(user: AuthMetadataUser, ...keys: string[]) {
  for (const key of keys) {
    const value = user.user_metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function getNameParts(user: AuthMetadataUser) {
  const firstName = metadataText(user, "given_name", "first_name");
  const lastName = metadataText(user, "family_name", "last_name");
  if (firstName || lastName) return { firstName, lastName };
  const fullName = metadataText(user, "full_name", "name");
  if (!fullName) return { firstName: null, lastName: null };
  const parts = fullName.split(/\s+/);
  return { firstName: parts[0] ?? null, lastName: parts.slice(1).join(" ") || null };
}

export async function completeAuthCallback(code: string | null) {
  if (!code) return "/login?error=auth_failed";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return "/login?error=auth_failed";

  const user = data.user as AuthMetadataUser;
  const email = user.email ?? "";
  const normalizedEmail = email.trim().toLowerCase();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!normalizedEmail.endsWith("@kmitl.ac.th") && normalizedEmail !== adminEmail) {
    await supabase.auth.signOut();
    return "/login?error=unauthorized_email";
  }

  const existing = await findUserByAuthId(user.id);
  if (existing?.deletedAt) {
    await supabase.auth.signOut();
    return "/login?error=account_inactive";
  }

  const names = getNameParts(user);
  const profile = {
    email,
    ...names,
    avatarUrl: metadataText(user, "avatar_url", "picture", "profile_image"),
  };
  if (existing) await updateActiveUser(user.id, existing, profile);
  else await createUser(user.id, profile);
  return "/announcement";
}
