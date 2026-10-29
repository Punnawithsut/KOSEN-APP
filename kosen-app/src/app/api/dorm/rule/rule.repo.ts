import { and, count, desc, eq, isNull, ilike } from "drizzle-orm";
import { db } from "@/db/client";
import { rules } from "@/db/schema";

/**
 * Rows per page for the dorm rules list.
 */
export const PAGE_SIZE = 10;

export type RuleFilters = {
  searchName?: string;
};

export type RuleUpdateData = {
  name?: string;
  rule_description?: string | null;
  penalty_description?: string | null;
  point_deduction?: number | null;
};

function buildRuleWhere(filters: RuleFilters) {
  return and(
    isNull(rules.deletedAt),
    filters.searchName ? ilike(rules.name, `%${filters.searchName}%`) : undefined,
  );
}

export async function listRules(
  filters: RuleFilters,
  page?: number,
) {
  const where = buildRuleWhere(filters);
  const baseQuery = db.select().from(rules).where(where).orderBy(desc(rules.createdAt));

  if (page !== undefined) {
    const offset = (page - 1) * PAGE_SIZE;
    const [items, [{ total }]] = await Promise.all([
      baseQuery.limit(PAGE_SIZE).offset(offset),
      db.select({ total: count() }).from(rules).where(where),
    ]);
    return { items, total, page, pageSize: PAGE_SIZE };
  }

  const items = await baseQuery;
  return { items };
}

export async function getRuleById(id: string) {
  return db.query.rules.findFirst({
    where: and(eq(rules.id, id), isNull(rules.deletedAt)),
  });
}

export async function createRule(data: RuleUpdateData) {
  const [created] = await db
    .insert(rules)
    .values({
      name: data.name!,
      rule_description: data.rule_description ?? null,
      penalty_description: data.penalty_description ?? null,
      point_deduction: data.point_deduction ?? null,
    })
    .returning();

  return await db.query.rules.findFirst({
    where: eq(rules.id, created.id),
  });
}

export async function updateRuleById(id: string, data: RuleUpdateData) {
  const [existing] = await db
    .update(rules)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.rule_description !== undefined && {
        rule_description: data.rule_description,
      }),
      ...(data.penalty_description !== undefined && {
        penalty_description: data.penalty_description,
      }),
      ...(data.point_deduction !== undefined && {
        point_deduction: data.point_deduction,
      }),
    })
    .where(and(eq(rules.id, id), isNull(rules.deletedAt)))
    .returning({ id: rules.id });

  if (!existing) return null;

  return await db.query.rules.findFirst({
    where: eq(rules.id, id),
  });
}

export async function softDeleteRuleById(id: string) {
  const deletedAt = new Date();
  const [deleted] = await db
    .update(rules)
    .set({ deletedAt })
    .where(and(eq(rules.id, id), isNull(rules.deletedAt)))
    .returning({ id: rules.id });

  return Boolean(deleted);
}
