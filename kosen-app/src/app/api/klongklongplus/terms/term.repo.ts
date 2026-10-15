import {
  and,
  asc,
  count,
  eq,
  gte,
  ilike,
  isNull,
  lte,
  ne,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db/client";
import { loans, terms } from "@/db/schema";

export const PAGE_SIZE = 20;

export type TermFilters = {
  search?: string;
};

function buildWhere(filters: TermFilters): SQL | undefined {
  return and(
    isNull(terms.deletedAt),
    filters.search ? ilike(terms.name, `%${filters.search}%`) : undefined,
  );
}

export async function findTerms(filters: TermFilters, page: number) {
  const where = buildWhere(filters);
  const offset = (page - 1) * PAGE_SIZE;
  const [items, [{ total }]] = await Promise.all([
    db.query.terms.findMany({
      where,
      orderBy: [asc(terms.startDate), asc(terms.name)],
      limit: PAGE_SIZE,
      offset,
    }),
    db.select({ total: count() }).from(terms).where(where),
  ]);

  return { items, total };
}

export async function findTermById(id: string) {
  return db.query.terms.findFirst({
    where: and(eq(terms.id, id), isNull(terms.deletedAt)),
  });
}

export async function findCurrentTerm(date: Date) {
  return db.query.terms.findFirst({
    where: and(
      isNull(terms.deletedAt),
      lte(terms.startDate, date),
      gte(terms.endDate, date),
    ),
    orderBy: [asc(terms.startDate)],
  });
}

export async function hasDateOverlap(
  startDate: Date,
  endDate: Date,
  excludeId?: string,
) {
  const [overlappingTerm] = await db
    .select({ id: terms.id })
    .from(terms)
    .where(
      and(
        isNull(terms.deletedAt),
        excludeId ? ne(terms.id, excludeId) : undefined,
        lte(terms.startDate, endDate),
        gte(terms.endDate, startDate),
      ),
    )
    .limit(1);

  return Boolean(overlappingTerm);
}

export async function insertTerm(
  data: typeof terms.$inferInsert,
) {
  const [created] = await db.insert(terms).values(data).returning();
  return created;
}

export async function updateTermById(
  id: string,
  data: Partial<typeof terms.$inferInsert>,
) {
  const [updated] = await db
    .update(terms)
    .set(data)
    .where(and(eq(terms.id, id), isNull(terms.deletedAt)))
    .returning();
  return updated;
}

export async function hasLoanReferences(termId: string) {
  const [loan] = await db
    .select({ id: loans.id })
    .from(loans)
    .where(eq(loans.termId, termId))
    .limit(1);
  return Boolean(loan);
}

export async function softDeleteTerm(id: string, userId: string) {
  const deletedAt = new Date();
  const [deleted] = await db
    .update(terms)
    .set({
      deletedAt,
      deletedBy: userId,
      updatedAt: deletedAt,
      updatedBy: userId,
    })
    .where(and(eq(terms.id, id), isNull(terms.deletedAt)))
    .returning({ id: terms.id });
  return Boolean(deleted);
}
