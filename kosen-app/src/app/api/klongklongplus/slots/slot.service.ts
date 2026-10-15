import { slotKindEnum } from "@/db/schema";
import { AppError, BadRequestError, NotFoundError } from "../../_shared/errors";
import * as slotRepo from "./slot.repo";

export type SlotKind = (typeof slotKindEnum.enumValues)[number];

export type SlotData = {
  kind: SlotKind;
  startTime: string;
  endTime: string;
  leadMin: number;
  displayOrder: number;
  isActive: boolean;
};

export type SlotUpdateData = Partial<SlotData>;

function parseObject(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new BadRequestError("Request body must be an object");
  }
  return raw as Record<string, unknown>;
}

function parseTime(raw: unknown, field: string): string {
  if (
    typeof raw !== "string" ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,6})?)?$/.test(raw)
  ) {
    throw new BadRequestError(
      `Field "${field}" must be a valid 24-hour time (HH:mm or HH:mm:ss)`,
    );
  }
  return raw;
}

function timeToMilliseconds(value: string): number {
  const [hours, minutes, seconds = "0"] = value.split(":");
  return (
    (Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)) * 1000
  );
}

function parseKind(raw: unknown): SlotKind {
  if (
    typeof raw !== "string" ||
    !slotKindEnum.enumValues.includes(raw as SlotKind)
  ) {
    throw new BadRequestError(
      `Field "kind" must be one of: ${slotKindEnum.enumValues.join(", ")}`,
    );
  }
  return raw as SlotKind;
}

function parseNonNegativeInteger(raw: unknown, field: string): number {
  if (!Number.isInteger(raw) || typeof raw !== "number" || raw < 0) {
    throw new BadRequestError(`Field "${field}" must be a non-negative integer`);
  }
  return raw;
}

function parseBoolean(raw: unknown, field: string): boolean {
  if (typeof raw !== "boolean") {
    throw new BadRequestError(`Field "${field}" must be a boolean`);
  }
  return raw;
}

function rejectUnknownFields(
  body: Record<string, unknown>,
  allowed: string[],
) {
  const unknown = Object.keys(body).find((field) => !allowed.includes(field));
  if (unknown) throw new BadRequestError(`Field "${unknown}" is not allowed`);
}

function validateTimeRange(startTime: string, endTime: string) {
  if (timeToMilliseconds(startTime) >= timeToMilliseconds(endTime)) {
    throw new BadRequestError("startTime must be earlier than endTime");
  }
}

const SLOT_FIELDS = [
  "kind",
  "startTime",
  "endTime",
  "leadMin",
  "displayOrder",
  "isActive",
];

export function parseCreateSlot(raw: unknown): SlotData {
  const body = parseObject(raw);
  rejectUnknownFields(body, SLOT_FIELDS);
  const data: SlotData = {
    kind: parseKind(body.kind),
    startTime: parseTime(body.startTime, "startTime"),
    endTime: parseTime(body.endTime, "endTime"),
    leadMin:
      body.leadMin === undefined
        ? 0
        : parseNonNegativeInteger(body.leadMin, "leadMin"),
    displayOrder:
      body.displayOrder === undefined
        ? 0
        : parseNonNegativeInteger(body.displayOrder, "displayOrder"),
    isActive:
      body.isActive === undefined ? true : parseBoolean(body.isActive, "isActive"),
  };
  validateTimeRange(data.startTime, data.endTime);
  return data;
}

export function parseUpdateSlot(raw: unknown): SlotUpdateData {
  const body = parseObject(raw);
  rejectUnknownFields(body, SLOT_FIELDS);
  if (Object.keys(body).length === 0) {
    throw new BadRequestError("At least one update field is required");
  }

  const data: SlotUpdateData = {};
  if (body.kind !== undefined) data.kind = parseKind(body.kind);
  if (body.startTime !== undefined)
    data.startTime = parseTime(body.startTime, "startTime");
  if (body.endTime !== undefined)
    data.endTime = parseTime(body.endTime, "endTime");
  if (body.leadMin !== undefined)
    data.leadMin = parseNonNegativeInteger(body.leadMin, "leadMin");
  if (body.displayOrder !== undefined)
    data.displayOrder = parseNonNegativeInteger(body.displayOrder, "displayOrder");
  if (body.isActive !== undefined)
    data.isActive = parseBoolean(body.isActive, "isActive");
  return data;
}

export function parseListQuery(searchParams: URLSearchParams) {
  const rawPage = searchParams.get("page") ?? "1";
  const page = Number(rawPage);
  if (!Number.isInteger(page) || page < 1) {
    throw new BadRequestError("page must be a positive integer");
  }

  const rawKind = searchParams.get("kind");
  if (rawKind && !slotKindEnum.enumValues.includes(rawKind as SlotKind)) {
    throw new BadRequestError(
      `kind must be one of: ${slotKindEnum.enumValues.join(", ")}`,
    );
  }

  const rawIsActive = searchParams.get("isActive");
  if (rawIsActive !== null && rawIsActive !== "true" && rawIsActive !== "false") {
    throw new BadRequestError("isActive must be true or false");
  }

  return {
    page,
    filters: {
      kind: rawKind ? (rawKind as SlotKind) : undefined,
      isActive:
        rawIsActive === null ? undefined : rawIsActive === "true",
    },
  };
}

export async function listSlots(page: number, filters: slotRepo.SlotFilters) {
  const { items, total } = await slotRepo.findSlots(filters, page);
  return { items, total, page, pageSize: slotRepo.PAGE_SIZE };
}

export async function getSlot(id: string) {
  const slot = await slotRepo.findSlotById(id);
  if (!slot) throw new NotFoundError("Slot not found");
  return slot;
}

export async function createSlot(data: SlotData, userId: string) {
  if (
    data.isActive &&
    (await slotRepo.hasActiveTimeOverlap(data.startTime, data.endTime))
  ) {
    throw new BadRequestError("Slot time overlaps with another active slot");
  }

  return slotRepo.insertSlot({
    ...data,
    createdBy: userId,
    updatedBy: userId,
  });
}

export async function updateSlot(
  id: string,
  data: SlotUpdateData,
  userId: string,
) {
  const existing = await getSlot(id);
  const startTime = data.startTime ?? existing.startTime;
  const endTime = data.endTime ?? existing.endTime;
  validateTimeRange(startTime, endTime);

  const isActive = data.isActive ?? existing.isActive;
  if (
    isActive &&
    (data.startTime !== undefined ||
      data.endTime !== undefined ||
      data.isActive === true) &&
    (await slotRepo.hasActiveTimeOverlap(startTime, endTime, id))
  ) {
    throw new BadRequestError("Slot time overlaps with another active slot");
  }

  if (data.isActive === false && (await slotRepo.hasLoanReferences(id))) {
    throw new AppError(
      "Slot is referenced by loan requests and cannot be deactivated",
      409,
    );
  }

  const updated = await slotRepo.updateSlotById(id, {
    ...data,
    updatedBy: userId,
    updatedAt: new Date(),
  });
  if (!updated) throw new NotFoundError("Slot not found");
  return updated;
}

export async function deleteSlot(id: string, userId: string) {
  await getSlot(id);
  if (await slotRepo.hasLoanReferences(id)) {
    throw new AppError(
      "Slot is referenced by loan requests and cannot be deleted",
      409,
    );
  }
  if (!(await slotRepo.softDeleteSlot(id, userId))) {
    throw new NotFoundError("Slot not found");
  }
}
