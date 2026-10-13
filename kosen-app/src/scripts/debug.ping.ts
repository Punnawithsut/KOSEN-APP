import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error("❌ ERROR: DATABASE_URL is not set in environment variables!");
    process.exit(1);
  }

  const u = new URL(url);
  console.log("🔍 Connection Details:", {
    host: u.hostname,
    port: u.port,
    user: u.username,
    passwordLength: u.password.length, // length only, never the password
  });

  const sql = postgres(url, { prepare: false, connect_timeout: 10, max: 1 });
  
  try {
    const res = await sql`select current_user, now()`;
    console.log("✅ OK:", res);
  } catch (e) {
    console.error("❌ FAILED:", (e as Error).message);
  } finally {
    await sql.end();
  }
}

main();