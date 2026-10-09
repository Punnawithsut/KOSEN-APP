import { asc, count, eq, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { loans } from "@/db/schema";

/**
 * Pure data access for `loans` — no business rules, no domain errors. The
 * caller (loan.service.ts) decides what an empty result means.
 */

export const PAGE_SIZE = 20;

export async function findLoans(where: SQL | undefined, page: number) {
  const offset = (page - 1) * PAGE_SIZE;

  const [items, [{ total }]] = await Promise.all([
    db.query.loans.findMany({
      where,
      with: {
        borrower: true,
        approver: true,
        unit: true,
        slot: true,
        term: true,
      },
      orderBy: [asc(loans.slotDate), asc(loans.requestedAt)],
      limit: PAGE_SIZE,
      offset,
    }),
    db.select({ total: count() }).from(loans).where(where),
  ]);

  return { items, total };
}

export async function findLoanById(id: string) {
  return db.query.loans.findFirst({
    where: eq(loans.id, id),
    with: {
      borrower: true,
      approver: true,
      unit: true,
      slot: true,
      term: true,
    },
  });
}

/**
 * Updates a loan only if it also matches `where` (e.g. still `pending`, or
 * still owned by a given admin — the guard that makes status transitions
 * race-safe). Returns the updated row, or `undefined` if nothing matched.
 */
export async function updateLoanWhere(
  where: SQL | undefined,
  data: Partial<typeof loans.$inferInsert>,
) {
  const [updated] = await db
    .update(loans)
    .set(data)
    .where(where)
    .returning();

  return updated;
}
