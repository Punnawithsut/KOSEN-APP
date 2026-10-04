import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "./schema";

config({ path: [".env.local", ".env"] });

async function seedAdmin() {
  const databaseUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const firstName = process.env.ADMIN_FIRST_NAME ?? "Admin";
  const lastName = process.env.ADMIN_LAST_NAME ?? "";

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run the seed.");
  }
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to find the admin account.",
    );
  }
  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL is required to seed an admin.");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let authUser = null;
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;

    authUser =
      data.users.find((user) => user.email?.toLowerCase() === adminEmail) ??
      null;
    if (authUser || data.users.length < 1000) break;
  }

  if (!authUser) {
    throw new Error(
      `No Supabase Auth account found for ${adminEmail}. Sign in with Google first, then run the seed again.`,
    );
  }

  const client = postgres(databaseUrl, { prepare: false });
  const db = drizzle(client);

  try {
    await db
      .insert(users)
      .values({
        userId: authUser.id,
        email: authUser.email ?? adminEmail,
        firstName,
        lastName,
        role: "admin",
      })
      .onConflictDoUpdate({
        target: users.userId,
        set: { role: "admin", firstName, lastName, updatedAt: new Date() },
      });

    console.info(`Admin role assigned to: ${authUser.email ?? adminEmail}`);
  } finally {
    await client.end();
  }
}

seedAdmin().catch((error: unknown) => {
  console.error("Failed to seed admin user:", error);
  process.exitCode = 1;
});
