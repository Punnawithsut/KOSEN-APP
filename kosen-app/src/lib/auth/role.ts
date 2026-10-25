import { createClient } from "@/lib/supabase/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) return null;

  const [row] = await db
    .select()
    .from(users)
    .where(and(eq(users.userId, data.user.id), isNull(users.deletedAt)))
    .limit(1);

  return row ?? null;
}

export async function isLoggedIn() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return Boolean(data.user);
}

//this one is for page that can be access by both user and admin and we use isAdmin() to check whether we should render specific components
export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin";
}

//this one is for page only the admin can access
export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    redirect("/login");
  }
}