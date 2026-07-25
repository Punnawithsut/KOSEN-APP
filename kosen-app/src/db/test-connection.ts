import "dotenv/config";
import { db } from "./client";
import { rooms } from "./schema";

async function main() {
  const result = await db.select().from(rooms);
  console.log("Connected! Rooms:", result);
}

main();