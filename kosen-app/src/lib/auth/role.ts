import { createClient } from "@/lib/supabase/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) return null;

  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.userId, data.user.id))
    .limit(1);

  return row ?? null;
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