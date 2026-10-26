import { and, count, desc, eq, isNull, ilike } from "drizzle-orm";
import { db } from "@/db/client";
import { dormWardensInfo, officeDays } from "@/db/schema";

/**
 * Rows per page for the dorm wardens list.
 */
export const PAGE_SIZE = 10;

export type WardenFilters = {
  searchName?: string;
  officeDay?: (typeof officeDays.enumValues)[number];
};

export type WardenUpdateData = {
  name?: string;
  lineID?: string | null;
  phone?: string | null;
  role?: string | null;
  officeDay?: (typeof officeDays.enumValues)[number];
  officeStartTime?: string;
  officeEndTime?: string;
};

function buildWardenWhere(filters: WardenFilters) {
  return and(
    isNull(dormWardensInfo.deletedAt),
    filters.searchName
      ? ilike(dormWardensInfo.name, `%${filters.searchName}%`)
      : undefined,
    filters.officeDay
      ? eq(dormWardensInfo.officeDay, filters.officeDay)
      : undefined,
  );
}

export async function listWardens(filters: WardenFilters, page: number) {
  const where = buildWardenWhere(filters);
  const offset = (page - 1) * PAGE_SIZE;

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(dormWardensInfo)
      .where(where)
      .orderBy(desc(dormWardensInfo.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ total: count() }).from(dormWardensInfo).where(where),
  ]);

  return { items, total };
}

export async function getWardenById(id: string) {
  return db.query.dormWardensInfo.findFirst({
    where: and(eq(dormWardensInfo.id, id), isNull(dormWardensInfo.deletedAt)),
    with: {
      createdByUser: true,
      updatedByUser: true,
      deletedByUser: true,
    },
  });
}

export async function createWarden(
  createdBy: string,
  data: WardenUpdateData,
) {
  const [warden] = await db
    .insert(dormWardensInfo)
    .values({
      name: data.name!,
      lineID: data.lineID ?? null,
      phone: data.phone ?? null,
      role: data.role ?? "Educator",
      officeDay: data.officeDay!,
      officeStartTime: data.officeStartTime!,
      officeEndTime: data.officeEndTime!,
      createdBy,
    })
    .returning({ id: dormWardensInfo.id });

  if (!warden) return null;

  return await db.query.dormWardensInfo.findFirst({
    where: eq(dormWardensInfo.id, warden.id),
    with: {
      createdByUser: true,
      updatedByUser: true,
      deletedByUser: true,
    },
  });
}

export async function updateWardenById(
  id: string,
  updatedBy: string,
  data: WardenUpdateData,
) {
  const updatedAt = new Date();
  const [existing] = await db
    .update(dormWardensInfo)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.lineID !== undefined && { lineID: data.lineID }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.role !== undefined && { role: data.role }),
      ...(data.officeDay !== undefined && { officeDay: data.officeDay }),
      ...(data.officeStartTime !== undefined && {
        officeStartTime: data.officeStartTime,
      }),
      ...(data.officeEndTime !== undefined && {
        officeEndTime: data.officeEndTime,
      }),
      updatedBy,
      updatedAt,
    })
    .where(
      and(eq(dormWardensInfo.id, id), isNull(dormWardensInfo.deletedAt)),
    )
    .returning({ id: dormWardensInfo.id });

  if (!existing) return null;

  return await db.query.dormWardensInfo.findFirst({
    where: eq(dormWardensInfo.id, id),
    with: {
      createdByUser: true,
      updatedByUser: true,
      deletedByUser: true,
    },
  });
}

export async function softDeleteWardenById(id: string, deletedBy: string) {
  const deletedAt = new Date();
  const [deleted] = await db
    .update(dormWardensInfo)
    .set({ deletedAt, deletedBy, updatedAt: deletedAt, updatedBy: deletedBy })
    .where(
      and(eq(dormWardensInfo.id, id), isNull(dormWardensInfo.deletedAt)),
    )
    .returning({ id: dormWardensInfo.id });

  return Boolean(deleted);
}
