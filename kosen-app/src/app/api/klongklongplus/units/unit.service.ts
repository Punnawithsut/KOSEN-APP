import { and, eq } from "drizzle-orm";
import { itemTypeEnum, unitStatusEnum, units } from "@/db/schema";
import { AppError, BadRequestError, NotFoundError } from "../../_shared/errors";
import * as unitRepo from "./unit.repo";

export type ItemType = (typeof itemTypeEnum.enumValues)[number];
export type UnitStatus = (typeof unitStatusEnum.enumValues)[number];

export type UnitFilters = {
  itemType?: ItemType;
  status?: UnitStatus;
  isActive?: boolean;
};

export type CreateUnitData = {
  code: string;
  itemType: ItemType;
  note?: string;
};

export type UpdateUnitData = {
  code?: string;
  itemType?: ItemType;
  note?: string;
  isActive?: boolean;
};

function buildUnitWhere(filters: UnitFilters) {
  return and(
    filters.itemType ? eq(units.itemType, filters.itemType) : undefined,
    filters.status ? eq(units.status, filters.status) : undefined,
    filters.isActive !== undefined
      ? eq(units.isActive, filters.isActive)
      : undefined,
  );
}

/** Parse ?itemType=&status=&isActive=&page= from the units list query string. */
export function parseListQuery(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const itemType = searchParams.get("itemType");
  const status = searchParams.get("status");
  const isActiveParam = searchParams.get("isActive");

  const filters: UnitFilters = {
    itemType:
      itemType && itemTypeEnum.enumValues.includes(itemType as ItemType)
        ? (itemType as ItemType)
        : undefined,
    status:
      status && unitStatusEnum.enumValues.includes(status as UnitStatus)
        ? (status as UnitStatus)
        : undefined,
    isActive: isActiveParam === null ? undefined : isActiveParam === "true",
  };

  return { page, filters };
}

export async function listUnits(filters: UnitFilters, page: number) {
  const where = buildUnitWhere(filters);
  const { items, total } = await unitRepo.findUnits(where, page);
  return { items, total, page, pageSize: unitRepo.PAGE_SIZE };
}

async function requireUnit(id: string) {
  const unit = await unitRepo.findUnitById(id);
  if (!unit) throw new NotFoundError("Unit not found");
  return unit;
}

function parseCode(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new BadRequestError('Field "code" is required');
  }
  return raw.trim();
}

function parseItemType(raw: unknown): ItemType {
  if (
    typeof raw !== "string" ||
    !itemTypeEnum.enumValues.includes(raw as ItemType)
  ) {
    throw new BadRequestError(
      `Field "itemType" must be one of: ${itemTypeEnum.enumValues.join(", ")}`,
    );
  }
  return raw as ItemType;
}

function parseUnitStatus(raw: unknown): UnitStatus {
  if (
    typeof raw !== "string" ||
    !unitStatusEnum.enumValues.includes(raw as UnitStatus)
  ) {
    throw new BadRequestError(
      `Field "status" must be one of: ${unitStatusEnum.enumValues.join(", ")}`,
    );
  }
  return raw as UnitStatus;
}

export function parseCreateUnitData(body: unknown): CreateUnitData {
  if (typeof body !== "object" || body === null) {
    throw new BadRequestError("Invalid request body");
  }
  const data = body as Record<string, unknown>;

  return {
    code: parseCode(data.code),
    itemType: parseItemType(data.itemType),
    note:
      typeof data.note === "string" && data.note.trim()
        ? data.note.trim()
        : undefined,
  };
}

export function parseUpdateUnitData(body: unknown): UpdateUnitData {
  if (typeof body !== "object" || body === null) {
    throw new BadRequestError("Invalid request body");
  }
  const data = body as Record<string, unknown>;

  const update: UpdateUnitData = {};
  if (data.code !== undefined) update.code = parseCode(data.code);
  if (data.itemType !== undefined)
    update.itemType = parseItemType(data.itemType);
  if (data.note !== undefined) {
    update.note = typeof data.note === "string" ? data.note.trim() : undefined;
  }
  if (data.isActive !== undefined) {
    if (typeof data.isActive !== "boolean") {
      throw new BadRequestError('Field "isActive" must be a boolean');
    }
    update.isActive = data.isActive;
  }

  return update;
}

export function parseStatusBody(body: unknown): UnitStatus {
  if (typeof body !== "object" || body === null) {
    throw new BadRequestError("Invalid request body");
  }
  return parseUnitStatus((body as Record<string, unknown>).status);
}

export async function createUnit(data: CreateUnitData) {
  return unitRepo.insertUnit({
    code: data.code,
    itemType: data.itemType,
    note: data.note ?? null,
  });
}

/** Throws NotFoundError if the unit doesn't exist. */
export async function updateUnitById(id: string, data: UpdateUnitData) {
  await requireUnit(id);

  const update: Partial<typeof units.$inferInsert> & { updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (data.code !== undefined) update.code = data.code;
  if (data.itemType !== undefined) update.itemType = data.itemType;
  if (data.note !== undefined) update.note = data.note ?? null;
  if (data.isActive !== undefined) update.isActive = data.isActive;

  return unitRepo.updateUnitById(id, update);
}

/** Throws NotFoundError if the unit doesn't exist. */
export async function updateUnitStatus(id: string, status: UnitStatus) {
  await requireUnit(id);
  return unitRepo.updateUnitById(id, { status, updatedAt: new Date() });
}

/**
 * `units.id` is referenced by `loans.unitId` with onDelete: "restrict", so a
 * unit with any loan history can't be hard-deleted. Prefer
 * `updateUnitById(id, { isActive: false })` ("ปิดใช้") for that case; this
 * only succeeds for units with no loans at all (e.g. created by mistake).
 * Throws NotFoundError if the unit doesn't exist.
 */
export async function deleteUnitById(id: string) {
  await requireUnit(id);

  try {
    await unitRepo.deleteUnitById(id);
  } catch (err) {
    const code = (err as { code?: string } | undefined)?.code;
    if (code === "23503") {
      throw new AppError(
        "This unit has loan history and can't be deleted — disable it instead (isActive: false)",
        409,
      );
    }
    throw err;
  }
}
