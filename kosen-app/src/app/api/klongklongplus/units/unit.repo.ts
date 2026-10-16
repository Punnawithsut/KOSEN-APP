import { asc, count, eq, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { units } from "@/db/schema";

/**
 * Pure data access for `units` — no business rules, no domain errors. The
 * caller (unit.service.ts) decides what an empty result or a thrown pg
 * error means.
 */

export const PAGE_SIZE = 20;

export async function findUnits(where: SQL | undefined, page: number) {
  const offset = (page - 1) * PAGE_SIZE;

  const [items, [{ total }]] = await Promise.all([
    db.query.units.findMany({
      where,
      orderBy: [asc(units.itemType), asc(units.code)],
      limit: PAGE_SIZE,
      offset,
    }),
    db.select({ total: count() }).from(units).where(where),
  ]);

  return { items, total };
}

export async function findUnitById(id: string) {
  return db.query.units.findFirst({ where: eq(units.id, id) });
}

export async function insertUnit(data: {
  code: string;
  itemType: (typeof units.$inferInsert)["itemType"];
  note: string | null;
}) {
  const [created] = await db.insert(units).values(data).returning();
  return created;
}

export async function updateUnitById(
  id: string,
  data: Partial<typeof units.$inferInsert>,
) {
  const [updated] = await db
    .update(units)
    .set(data)
    .where(eq(units.id, id))
    .returning();

  return updated;
}

/** Lets a FK violation (unit has loan history, onDelete: "restrict") bubble up raw — the service translates it. */
export async function deleteUnitById(id: string) {
  await db.delete(units).where(eq(units.id, id));
}
