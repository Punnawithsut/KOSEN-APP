import { BadRequestError, NotFoundError } from "../../_shared/errors";
// import { parsePageQuery } from "../../_shared/pagination";
import {
  createWarden as insertWarden,
  getWardenById,
  listWardens as queryWardens,
  softDeleteWardenById,
  type WardenFilters,
  type WardenUpdateData,
  updateWardenById,
  // PAGE_SIZE,
} from "./dormwardens.repo";

const ALLOWED_OFFICE_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
type OfficeDay = (typeof ALLOWED_OFFICE_DAYS)[number];

function parseObjectBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new BadRequestError("JSON body must be an object.");
  }
  return body as Record<string, unknown>;
}

function validateWardenId(id: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    throw new BadRequestError("Warden ID must be a valid UUID.");
  }
}

function parseRequiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new BadRequestError(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

function parseOptionalText(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new BadRequestError("Field must be a string.");
  }
  return value.trim() || null;
}

function parseOfficeDay(value: unknown): OfficeDay {
  if (
    typeof value !== "string" ||
    !ALLOWED_OFFICE_DAYS.includes(value as (typeof ALLOWED_OFFICE_DAYS)[number])
  ) {
    throw new BadRequestError(
      `officeDay must be one of: ${ALLOWED_OFFICE_DAYS.join(", ")}`,
    );
  }
  return value as OfficeDay;
}

function parseRequiredOfficeTime(value: unknown, field: string): string {
  const parsed = parseOptionalText(value);
  if (!parsed) {
    throw new BadRequestError(`${field} is required.`);
  }
  return parsed;
}

export function parseListQuery(searchParams: URLSearchParams) {
  // const page = parsePageQuery(searchParams, {
  //   pageSize: PAGE_SIZE,
  //   required: true,
  // });

  const filters: WardenFilters = {};
  const searchName = searchParams.get("searchName")?.trim();
  if (searchName) filters.searchName = searchName;

  const officeDayParam = searchParams.get("officeDay")?.trim();
  if (officeDayParam) filters.officeDay = parseOfficeDay(officeDayParam);

  // return { page, filters };
  return { filters };
}

export async function listWardens(filters: WardenFilters /*, page: number*/) {
  const { items /*, total*/ } = await queryWardens(filters /*, page*/);
  return {
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      lineID: item.lineID,
      phone: item.phone,
      role: item.role,
      officeDay: item.officeDay,
      officeStartTime: item.officeStartTime,
      officeEndTime: item.officeEndTime,
      createdBy: item.createdBy,
      updatedBy: item.updatedBy,
      deletedBy: item.deletedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,
    })),
    // pagination: { // Again, could be redundant since its not a whole page
    //   page,
    //   pageSize: PAGE_SIZE,
    //   total,
    //   totalPages: Math.ceil(total / PAGE_SIZE),
    // },
  };
}

export async function fetchWarden(id: string) {
  validateWardenId(id);
  const warden = await getWardenById(id);
  if (!warden) throw new NotFoundError("Warden not found.");
  return {
    id: warden.id,
    name: warden.name,
    lineID: warden.lineID,
    phone: warden.phone,
    role: warden.role,
    officeDay: warden.officeDay,
    officeStartTime: warden.officeStartTime,
    officeEndTime: warden.officeEndTime,
    createdBy: warden.createdBy,
    updatedBy: warden.updatedBy,
    deletedBy: warden.deletedBy,
    createdAt: warden.createdAt,
    updatedAt: warden.updatedAt,
    deletedAt: warden.deletedAt,
  };
}

export async function createWarden(createdBy: string, body: unknown) {
  const payload = parseObjectBody(body);
  const name = parseRequiredText(payload.name, "Name");
  const lineID = parseOptionalText(payload.lineID);
  const phone = parseOptionalText(payload.phone);
  const role =
    typeof payload.role === "string" && payload.role.trim()
      ? payload.role.trim()
      : "Educator";
  const officeDay = parseOfficeDay(payload.officeDay);
  const officeStartTime = parseRequiredOfficeTime(
    payload.officeStartTime,
    "officeStartTime",
  );
  const officeEndTime = parseRequiredOfficeTime(
    payload.officeEndTime,
    "officeEndTime",
  );

  return await insertWarden(createdBy, {
    name,
    lineID,
    phone,
    role,
    officeDay,
    officeStartTime,
    officeEndTime,
  }).then((created) => {
    if (!created) {
      throw new NotFoundError("Failed to create warden.");
    }
    return {
      id: created.id,
      name: created.name,
      lineID: created.lineID,
      phone: created.phone,
      role: created.role,
      officeDay: created.officeDay,
      officeStartTime: created.officeStartTime,
      officeEndTime: created.officeEndTime,
      createdBy: created.createdBy,
      updatedBy: created.updatedBy,
      deletedBy: created.deletedBy,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      deletedAt: created.deletedAt,
    };
  });
}

export async function modifyWarden(
  id: string,
  updatedBy: string,
  body: unknown,
) {
  validateWardenId(id);
  const payload = parseObjectBody(body);
  const data: WardenUpdateData = {};

  if ("name" in payload) data.name = parseRequiredText(payload.name, "Name");
  if ("lineID" in payload) data.lineID = parseOptionalText(payload.lineID);
  if ("phone" in payload) data.phone = parseOptionalText(payload.phone);
  if ("role" in payload) {
    const role = parseOptionalText(payload.role);
    data.role = role ?? "Educator";
  }
  if ("officeDay" in payload) data.officeDay = parseOfficeDay(payload.officeDay);
  if ("officeStartTime" in payload) {
    const officeStartTime = parseOptionalText(payload.officeStartTime);
    if (officeStartTime) data.officeStartTime = officeStartTime;
  }
  if ("officeEndTime" in payload) {
    const officeEndTime = parseOptionalText(payload.officeEndTime);
    if (officeEndTime) data.officeEndTime = officeEndTime;
  }

  if (Object.keys(data).length === 0) {
    throw new BadRequestError("No valid update fields provided.");
  }

  const result = await updateWardenById(id, updatedBy, data);
  if (!result) throw new NotFoundError("Warden not found.");

  return {
    id: result.id,
    name: result.name,
    lineID: result.lineID,
    phone: result.phone,
    role: result.role,
    officeDay: result.officeDay,
    officeStartTime: result.officeStartTime,
    officeEndTime: result.officeEndTime,
    createdBy: result.createdBy,
    updatedBy: result.updatedBy,
    deletedBy: result.deletedBy,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    deletedAt: result.deletedAt,
  };
}

export async function removeWarden(id: string, deletedBy: string) {
  validateWardenId(id);
  if (!(await softDeleteWardenById(id, deletedBy))) {
    throw new NotFoundError("Warden not found.");
  }
}
