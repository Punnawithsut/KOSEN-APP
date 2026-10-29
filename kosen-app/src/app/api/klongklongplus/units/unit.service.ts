import { AppError, BadRequestError, NotFoundError } from "../../_shared/errors";
import { parsePageQuery } from "../../_shared/pagination";
import { ITEM_TYPES, UNIT_STATUSES, type ItemType, type UnitStatus } from "@/lib/klongklongplus/domain";
import * as unitRepo from "./unit.repo";

export type { ItemType, UnitStatus } from "@/lib/klongklongplus/domain";

export type UnitFilters = { itemType?: ItemType; status?: UnitStatus; isActive?: boolean; search?: string };

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

/** Parse ?itemType=&status=&isActive=&search=&page= from the units list query string. */
export function parseListQuery(searchParams: URLSearchParams) {
  const page = parsePageQuery(searchParams, { pageSize: unitRepo.PAGE_SIZE });

  const itemType = searchParams.get("itemType");
  const status = searchParams.get("status");
  const isActiveParam = searchParams.get("isActive");

  const filters: UnitFilters = {
    itemType:
      itemType && ITEM_TYPES.includes(itemType as ItemType)
        ? (itemType as ItemType)
        : undefined,
    status:
      status && UNIT_STATUSES.includes(status as UnitStatus)
        ? (status as UnitStatus)
        : undefined,
    isActive: isActiveParam === null ? undefined : isActiveParam === "true",
    search: searchParams.get("search")?.trim() || undefined,
  };

  return { page, filters };
}

export async function listUnits(filters: UnitFilters, page: number) {
  const { items, total } = await unitRepo.findUnits(filters, page);
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
    !ITEM_TYPES.includes(raw as ItemType)
  ) {
    throw new BadRequestError(
      `Field "itemType" must be one of: ${ITEM_TYPES.join(", ")}`,
    );
  }
  return raw as ItemType;
}

function parseUnitStatus(raw: unknown): UnitStatus {
  if (
    typeof raw !== "string" ||
    !UNIT_STATUSES.includes(raw as UnitStatus)
  ) {
    throw new BadRequestError(
      `Field "status" must be one of: ${UNIT_STATUSES.join(", ")}`,
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

  const update: { code?: string; itemType?: ItemType; note?: string | null; isActive?: boolean; status?: UnitStatus; updatedAt: Date } = {
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
