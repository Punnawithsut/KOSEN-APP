// This file is for when run `npm run migrate` and the migration is not apply.


import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;
const requestedFile = process.argv[2];

if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

if (!requestedFile) {
  console.error("Usage: npx tsx src/db/migrate.ts <migration-tag-or-file>");
  console.error("Example: npx tsx src/db/migrate.ts 0008_slim_lord_tyger");
  process.exit(1);
}

const fileName = requestedFile.endsWith(".sql") ? requestedFile : `${requestedFile}.sql`;
if (path.basename(fileName) !== fileName || !/^\d{4}_[a-z0-9_-]+\.sql$/i.test(fileName)) {
  console.error("Pass a migration filename or tag from the drizzle/ directory.");
  process.exit(1);
}

const migrationPath = path.resolve(process.cwd(), "drizzle", fileName);
const migrationRoot = path.resolve(process.cwd(), "drizzle") + path.sep;
if (!migrationPath.startsWith(migrationRoot)) {
  console.error("Migration file must be inside drizzle/.");
  process.exit(1);
}

async function runMigrationFile() {
  const client = postgres(connectionString!, { max: 1, prepare: false });
  try {
    const source = await readFile(migrationPath, "utf8");
    const statements = source
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    console.log(`Applying ${path.basename(migrationPath)} (${statements.length} statements)`);
    let succeeded = 0;
    const failures: { index: number; error: unknown; sql: string }[] = [];

    for (const [index, statement] of statements.entries()) {
      try {
        await client.unsafe(statement);
        succeeded += 1;
        console.log(`[OK] Statement ${index + 1}/${statements.length}`);
      } catch (error) {
        failures.push({ index: index + 1, error, sql: statement });
        console.error(`[ERROR] Statement ${index + 1}/${statements.length}`);
        console.error(error);
      }
    }

    console.log(`\nFinished ${path.basename(migrationPath)}: ${succeeded} succeeded, ${failures.length} failed.`);
    if (failures.length) {
      console.error("\nFailed statements:");
      for (const failure of failures) {
        console.error(`\n--- Statement ${failure.index} ---`);
        console.error(failure.sql);
        console.error(failure.error);
      }
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`Could not read or apply ${migrationPath}:`, error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

void runMigrationFile();
