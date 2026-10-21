import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  ne,
  notExists,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db/client";
import {
  itemTypeEnum,
  loans,
  slots,
  slotKindEnum,
  terms,
  units,
  users,
} from "@/db/schema";
import { hasReachedTermLoanQuota } from "./loan-quota";

/**
 * Pure data access for `loans` — no business rules, no domain errors. The
 * caller (loan.service.ts) decides what an empty result means.
 */

export const PAGE_SIZE = 20;

const RESERVED_STATUSES = ["pending", "approved", "delivered", "overdue"] as const;

export async function findLoans(
  where: SQL | undefined,
  page: number,
  borrowerName?: string,
  unitSearch?: string,
) {
  const offset = (page - 1) * PAGE_SIZE;
  const normalizedName = borrowerName?.trim().replace(/\s+/g, " ");
  const borrowerNameWhere = normalizedName
    ? inArray(
        loans.borrowerId,
        db
          .select({ userId: users.userId })
          .from(users)
          .where(
            or(
              ilike(users.firstName, `%${normalizedName}%`),
              ilike(users.lastName, `%${normalizedName}%`),
              ilike(
                sql`concat_ws(' ', ${users.firstName}, ${users.lastName})`,
                `%${normalizedName}%`,
              ),
            ),
          ),
      )
    : undefined;
  const normalizedUnit = unitSearch?.trim();
  const unitWhere = normalizedUnit
    ? inArray(
        loans.unitId,
        db
          .select({ id: units.id })
          .from(units)
          .where(ilike(units.code, `%${normalizedUnit}%`)),
      )
    : undefined;
  const filtersWhere = and(
    where,
    borrowerNameWhere,
    unitWhere,
    isNull(loans.deletedAt),
  );

  const [items, [{ total }]] = await Promise.all([
    db.query.loans.findMany({
      where: filtersWhere,
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
    db
      .select({ total: count() })
      .from(loans)
      .where(filtersWhere),
  ]);

  return { items, total };
}

export async function findUserLoans(
  userId: string,
  page: number,
  filters: {
    status?: (typeof loans.$inferSelect)["status"];
    itemType?: (typeof loans.$inferSelect)["itemType"];
    slotDate?: string;
    slotId?: string;
    unitSearch?: string;
  } = {},
) {
  const offset = (page - 1) * PAGE_SIZE;
  const unitSearch = filters.unitSearch?.trim();
  const unitSearchWhere = unitSearch
    ? inArray(
        loans.unitId,
        db
          .select({ id: units.id })
          .from(units)
          .where(ilike(units.code, `%${unitSearch}%`)),
      )
    : undefined;
  const where = and(
    eq(loans.borrowerId, userId),
    isNull(loans.deletedAt),
    filters.status ? eq(loans.status, filters.status) : undefined,
    filters.itemType ? eq(loans.itemType, filters.itemType) : undefined,
    filters.slotDate ? eq(loans.slotDate, filters.slotDate) : undefined,
    filters.slotId ? eq(loans.slotId, filters.slotId) : undefined,
    unitSearchWhere,
  );

  const [items, [{ total }]] = await Promise.all([
    db.query.loans.findMany({
      where,
      with: {
        borrower: {
          columns: {
            userId: true,
            studentId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            department: true,
            year: true,
          },
        },
        unit: true,
        slot: true,
        term: true,
      },
      orderBy: [desc(loans.slotDate), desc(loans.requestedAt)],
      limit: PAGE_SIZE,
      offset,
    }),
    db.select({ total: count() }).from(loans).where(where),
  ]);

  return { items, total };
}

export async function findLoanById(id: string) {
  return db.query.loans.findFirst({
    where: and(eq(loans.id, id), isNull(loans.deletedAt)),
    with: {
      borrower: true,
      approver: true,
      unit: true,
      slot: true,
      term: true,
    },
  });
}

export async function findBookingDetails(termId: string, slotId: string) {
  const [term, slot] = await Promise.all([
    db.query.terms.findFirst({
      where: eq(terms.id, termId),
    }),
    db.query.slots.findFirst({
      where: eq(slots.id, slotId),
    }),
  ]);

  return { term, slot };
}

export async function countTermLoanQuotaSlotsInUse(
  borrowerId: string,
  termId: string,
  excludeLoanId?: string,
) {
  const [{ total }] = await db
    .select({ total: count() })
    .from(loans)
    .where(
      and(
        eq(loans.borrowerId, borrowerId),
        eq(loans.termId, termId),
        isNull(loans.deletedAt),
        or(
          isNotNull(loans.quotaConsumedAt),
          eq(loans.status, "pending"),
        ),
        excludeLoanId ? ne(loans.id, excludeLoanId) : undefined,
      ),
    );

  return total;
}

export async function findAvailableSlots(
  unitId: string,
  slotDate: string,
  kind: (typeof slotKindEnum.enumValues)[number],
  excludeLoanId?: string,
) {
  const reservation = db
    .select({ id: loans.id })
    .from(loans)
    .where(
      and(
        eq(loans.unitId, unitId),
        eq(loans.slotDate, slotDate),
        eq(loans.slotId, slots.id),
        inArray(loans.status, RESERVED_STATUSES),
        excludeLoanId ? ne(loans.id, excludeLoanId) : undefined,
      ),
    );

  return db.query.slots.findMany({
    where: and(
      isNull(slots.deletedAt),
      eq(slots.isActive, true),
      eq(slots.kind, kind),
      notExists(reservation),
    ),
    orderBy: [asc(slots.displayOrder), asc(slots.startTime)],
  });
}

export async function createUserLoan(data: {
  borrowerId: string;
  createdBy: string;
  itemType?: (typeof itemTypeEnum.enumValues)[number];
  termId: string;
  slotId: string;
  slotDate: string;
  unitId: string;
  returnNote: string | null;
}) {
  return db.transaction(async (tx) => {
    await tx
      .select({ userId: users.userId })
      .from(users)
      .where(eq(users.userId, data.borrowerId))
      .for("update");

    const [{ total: quotaSlotsInUse }] = await tx
      .select({ total: count() })
      .from(loans)
      .where(
        and(
          eq(loans.borrowerId, data.borrowerId),
          eq(loans.termId, data.termId),
          isNull(loans.deletedAt),
          or(
            isNotNull(loans.quotaConsumedAt),
            eq(loans.status, "pending"),
          ),
        ),
      );

    if (hasReachedTermLoanQuota(quotaSlotsInUse)) {
      return { kind: "quota_exceeded" } as const;
    }

    const [unit] = await tx
      .select({
        id: units.id,
        itemType: units.itemType,
        status: units.status,
        isActive: units.isActive,
      })
      .from(units)
      .where(and(eq(units.id, data.unitId), isNull(units.deletedAt)))
      .for("update");

    if (!unit) return { kind: "unit_not_found" } as const;
    if (data.itemType !== undefined && unit.itemType !== data.itemType) {
      return { kind: "unit_type_mismatch" } as const;
    }
    if (!unit.isActive || unit.status !== "available") {
      return { kind: "unit_unavailable" } as const;
    }

    const [reservation] = await tx
      .select({ id: loans.id })
      .from(loans)
      .where(
        and(
          eq(loans.unitId, data.unitId),
          eq(loans.slotDate, data.slotDate),
          eq(loans.slotId, data.slotId),
          inArray(loans.status, RESERVED_STATUSES),
        ),
      )
      .limit(1);

    if (reservation) return { kind: "unit_unavailable" } as const;

    const [created] = await tx
      .insert(loans)
      .values({
        ...data,
        itemType: unit.itemType,
        status: "pending",
      })
      .returning();

    return { kind: "created", loan: created } as const;
  });
}

export async function updateUserLoan(
  id: string,
  userId: string,
  data: {
    termId?: string;
    slotId?: string;
    slotDate?: string;
    returnNote?: string | null;
  },
) {
  return db.transaction(async (tx) => {
    const [candidate] = await tx
      .select({ borrowerId: loans.borrowerId })
      .from(loans)
      .where(and(eq(loans.id, id), isNull(loans.deletedAt)))
      .limit(1);

    if (!candidate) return { kind: "not_found" } as const;

    await tx
      .select({ userId: users.userId })
      .from(users)
      .where(eq(users.userId, candidate.borrowerId))
      .for("update");

    const [loan] = await tx
      .select()
      .from(loans)
      .where(and(eq(loans.id, id), isNull(loans.deletedAt)))
      .for("update");

    if (!loan) return { kind: "not_found" } as const;
    if (loan.borrowerId !== userId && loan.createdBy !== userId) {
      return { kind: "not_owner" } as const;
    }
    if (loan.status !== "pending") return { kind: "not_pending" } as const;

    const termId = data.termId ?? loan.termId;
    const [{ total: quotaSlotsInUse }] = await tx
      .select({ total: count() })
      .from(loans)
      .where(
        and(
          eq(loans.borrowerId, loan.borrowerId),
          eq(loans.termId, termId),
          isNull(loans.deletedAt),
          or(
            isNotNull(loans.quotaConsumedAt),
            eq(loans.status, "pending"),
          ),
          ne(loans.id, id),
        ),
      );

    if (hasReachedTermLoanQuota(quotaSlotsInUse)) {
      return { kind: "quota_exceeded" } as const;
    }

    const slotDate = data.slotDate ?? loan.slotDate;
    const slotId = data.slotId ?? loan.slotId;

    const [unit] = await tx
      .select({
        id: units.id,
        status: units.status,
        isActive: units.isActive,
      })
      .from(units)
      .where(and(eq(units.id, loan.unitId), isNull(units.deletedAt)))
      .for("update");

    if (!unit) return { kind: "unit_not_found" } as const;
    if (!unit.isActive || unit.status !== "available") {
      return { kind: "unit_unavailable" } as const;
    }

    const [reservation] = await tx
      .select({ id: loans.id })
      .from(loans)
      .where(
        and(
          eq(loans.unitId, loan.unitId),
          eq(loans.slotDate, slotDate),
          eq(loans.slotId, slotId),
          inArray(loans.status, RESERVED_STATUSES),
          ne(loans.id, id),
        ),
      )
      .limit(1);

    if (reservation) return { kind: "unit_unavailable" } as const;

    const [updated] = await tx
      .update(loans)
      .set({
        ...data,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(loans.id, id),
          or(eq(loans.borrowerId, userId), eq(loans.createdBy, userId)),
          eq(loans.status, "pending"),
          isNull(loans.deletedAt),
        ),
      )
      .returning();

    if (!updated) return { kind: "not_pending" } as const;
    return { kind: "updated", loan: updated } as const;
  });
}

export async function deleteUserLoan(id: string, userId: string) {
  const deletedAt = new Date();
  const [deleted] = await db
    .update(loans)
    .set({
      status: "cancelled",
      deletedAt,
      deletedBy: userId,
      updatedAt: deletedAt,
      updatedBy: userId,
    })
    .where(
      and(
        eq(loans.id, id),
        or(eq(loans.borrowerId, userId), eq(loans.createdBy, userId)),
        eq(loans.status, "pending"),
        isNull(loans.deletedAt),
      ),
    )
    .returning({ id: loans.id });

  return deleted;
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
    .where(and(where, isNull(loans.deletedAt)))
    .returning();

  return updated;
}

export async function approveLoanWithinQuota(
  loanId: string,
  adminId: string,
  approvedAt: Date,
) {
  return db.transaction(async (tx) => {
    const [candidate] = await tx
      .select({ borrowerId: loans.borrowerId })
      .from(loans)
      .where(and(eq(loans.id, loanId), isNull(loans.deletedAt)))
      .limit(1);

    if (!candidate) return { kind: "not_found" } as const;

    await tx
      .select({ userId: users.userId })
      .from(users)
      .where(eq(users.userId, candidate.borrowerId))
      .for("update");

    const [loan] = await tx
      .select()
      .from(loans)
      .where(and(eq(loans.id, loanId), isNull(loans.deletedAt)))
      .for("update");

    if (!loan) return { kind: "not_found" } as const;
    if (loan.status !== "pending") return { kind: "not_pending" } as const;

    const [{ total }] = await tx
      .select({ total: count() })
      .from(loans)
      .where(
        and(
          eq(loans.borrowerId, loan.borrowerId),
          eq(loans.termId, loan.termId),
          isNotNull(loans.quotaConsumedAt),
        ),
      );

    if (hasReachedTermLoanQuota(total)) {
      return { kind: "quota_exceeded" } as const;
    }

    const [approved] = await tx
      .update(loans)
      .set({
        status: "approved",
        approvedBy: adminId,
        approvedAt,
        quotaConsumedAt: approvedAt,
        updatedAt: approvedAt,
      })
      .where(
        and(
          eq(loans.id, loanId),
          eq(loans.status, "pending"),
          isNull(loans.deletedAt),
        ),
      )
      .returning();

    return approved
      ? ({ kind: "approved", loan: approved } as const)
      : ({ kind: "not_pending" } as const);
  });
}
