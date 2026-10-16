import {
  and,
  asc,
  count,
  eq,
  gt,
  inArray,
  isNull,
  lt,
  ne,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db/client";
import { loans, loanStatusEnum, slots, slotKindEnum } from "@/db/schema";

export type SlotKind = (typeof slotKindEnum.enumValues)[number];

export type SlotFilters = {
  kind?: SlotKind;
  isActive?: boolean;
};

export const PAGE_SIZE = 20;

function buildWhere(filters: SlotFilters): SQL | undefined {
  return and(
    isNull(slots.deletedAt),
    filters.kind ? eq(slots.kind, filters.kind) : undefined,
    filters.isActive !== undefined
      ? eq(slots.isActive, filters.isActive)
      : undefined,
  );
}

export async function findSlots(filters: SlotFilters, page: number) {
  const where = buildWhere(filters);
  const offset = (page - 1) * PAGE_SIZE;
  const [items, [{ total }]] = await Promise.all([
    db.query.slots.findMany({
      where,
      orderBy: [asc(slots.displayOrder), asc(slots.startTime)],
      limit: PAGE_SIZE,
      offset,
    }),
    db.select({ total: count() }).from(slots).where(where),
  ]);

  return { items, total };
}

export async function findSlotById(id: string) {
  return db.query.slots.findFirst({
    where: and(eq(slots.id, id), isNull(slots.deletedAt)),
  });
}

export async function hasActiveTimeOverlap(
  startTime: string,
  endTime: string,
  excludeId?: string,
) {
  const [overlappingSlot] = await db
    .select({ id: slots.id })
    .from(slots)
    .where(
      and(
        isNull(slots.deletedAt),
        eq(slots.isActive, true),
        excludeId ? ne(slots.id, excludeId) : undefined,
        lt(slots.startTime, endTime),
        gt(slots.endTime, startTime),
      ),
    )
    .limit(1);

  return Boolean(overlappingSlot);
}

export async function insertSlot(data: typeof slots.$inferInsert) {
  const [created] = await db.insert(slots).values(data).returning();
  return created;
}

export async function updateSlotById(
  id: string,
  data: Partial<typeof slots.$inferInsert>,
) {
  const [updated] = await db
    .update(slots)
    .set(data)
    .where(and(eq(slots.id, id), isNull(slots.deletedAt)))
    .returning();
  return updated;
}

export async function hasActiveLoanReferences(slotId: string) {
  const [loan] = await db
    .select({ id: loans.id })
    .from(loans)
    .where(
      and(
        eq(loans.slotId, slotId),
        isNull(loans.deletedAt),
        inArray(loans.status, [
          "pending",
          "approved",
          "delivered",
          "overdue",
        ] satisfies (typeof loanStatusEnum.enumValues)[number][]),
      ),
    )
    .limit(1);
  return Boolean(loan);
}

export async function softDeleteSlot(id: string, userId: string) {
  const deletedAt = new Date();
  const [deleted] = await db
    .update(slots)
    .set({
      isActive: false,
      deletedAt,
      deletedBy: userId,
      updatedAt: deletedAt,
      updatedBy: userId,
    })
    .where(and(eq(slots.id, id), isNull(slots.deletedAt)))
    .returning({ id: slots.id });
  return Boolean(deleted);
}
