import { randomUUID } from "node:crypto";
import { BadRequestError, NotFoundError } from "../_shared/errors";
import {
  createAnnouncement as insertAnnouncement,
  deleteAnnouncementById,
  getAnnouncementForAdminById,
  getAnnouncementById,
  listAnnouncements as queryAnnouncements,
  updateAnnouncementById,
  type AnnouncementFilters,
  type AnnouncementType,
  type AnnouncementUpdateData,
} from "./announcement.repo";
import {
  getAnnouncementFileUrl,
  removeAnnouncementFiles,
  uploadAnnouncementFiles,
} from "./announcement.storage";

const PAGE_SIZE = 5;
const ALLOWED_DEPARTMENTS = [
  "Computer Engineering",
  "Mechanical Engineering",
  "Electrical and Electronics Engineering",
] as const;
const ALLOWED_TYPES = ["for_you", "news", "events"] as const;

type AnnouncementRecord = NonNullable<
  Awaited<ReturnType<typeof getAnnouncementById>>
>;

function parseObjectBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new BadRequestError("JSON body must be an object.");
  }
  return body as Record<string, unknown>;
}

export async function parseAnnouncementFormData(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    throw new BadRequestError("Request must contain multipart form data.");
  }

  const fields: Record<string, unknown> = {};
  for (const key of ["name", "description", "year", "department", "type"]) {
    const value = formData.get(key);
    if (value === null) continue;
    if (typeof value !== "string") {
      throw new BadRequestError(`${key} must be a text field.`);
    }
    fields[key] = key === "year" && value !== "all" ? Number(value) : value;
  }

  const fileEntries = formData.getAll("files");
  if (fileEntries.length > 10) {
    throw new BadRequestError("An announcement can have at most 10 files.");
  }

  const files: File[] = [];
  for (const entry of fileEntries) {
    if (typeof entry === "string") {
      throw new BadRequestError(
        "Each files field must contain an uploaded file.",
      );
    }
    if (entry.size === 0) {
      throw new BadRequestError("Uploaded files cannot be empty.");
    }
    if (entry.size > 50 * 1024 * 1024) {
      throw new BadRequestError("Each file must be 50 MiB or smaller.");
    }
    files.push(entry);
  }

  const clearFiles = formData.get("clearFiles");
  if (clearFiles !== null && clearFiles !== "true" && clearFiles !== "false") {
    throw new BadRequestError("clearFiles must be 'true' or 'false'.");
  }

  return {
    fields,
    files,
    replaceFiles: formData.has("files") || clearFiles === "true",
  };
}

function validateAnnouncementId(id: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    throw new BadRequestError("Announcement ID must be a valid UUID.");
  }
}

async function serializeAnnouncement(announcement: AnnouncementRecord) {
  return {
    id: announcement.id,
    name: announcement.title,
    description: announcement.content,
    year: announcement.targetYear ?? "all",
    department: announcement.targetDepartment ?? "all",
    type: announcement.category ?? "all",
    files: await Promise.all(
      announcement.attachments.map(async (file) => ({
        url: file.storagePath
          ? await getAnnouncementFileUrl(file.storagePath)
          : file.fileUrl,
        type: file.fileType,
        displayOrder: file.displayOrder,
      })),
    ),
    authorId: announcement.authorId,
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt,
  };
}

function parseYear(value: unknown): number | null {
  if (value === undefined || value === "all") return null;
  const year =
    typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  if (
    typeof year !== "number" ||
    !Number.isInteger(year) ||
    year < 1 ||
    year > 5
  ) {
    throw new BadRequestError(
      "Year must be 'all' or an integer between 1 and 5.",
    );
  }
  return year;
}

function parseDepartment(value: unknown): string | null {
  if (value === undefined || value === "all") return null;
  if (
    typeof value !== "string" ||
    !ALLOWED_DEPARTMENTS.includes(value as (typeof ALLOWED_DEPARTMENTS)[number])
  ) {
    throw new BadRequestError(
      `Department must be 'all' or one of: ${ALLOWED_DEPARTMENTS.join(", ")}`,
    );
  }
  return value;
}

function parseType(value: unknown): AnnouncementType | null {
  if (value === undefined || value === "all") return null;
  if (
    typeof value !== "string" ||
    !ALLOWED_TYPES.includes(value as (typeof ALLOWED_TYPES)[number])
  ) {
    throw new BadRequestError(
      `Type must be 'all' or one of: ${ALLOWED_TYPES.join(", ")}`,
    );
  }
  return value as AnnouncementType;
}

function parseRequiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new BadRequestError(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

export function parseListQuery(searchParams: URLSearchParams) {
  const pageValue = searchParams.get("page");
  const page = pageValue === null ? NaN : Number(pageValue);
  if (!Number.isInteger(page) || page < 1) {
    throw new BadRequestError(
      "A positive integer page query parameter is required.",
    );
  }

  const filters: AnnouncementFilters = {};
  const searchName = searchParams.get("searchName")?.trim();
  if (searchName) filters.searchName = searchName;

  const yearParam = searchParams.get("searchYear");
  if (yearParam && yearParam !== "all") {
    const year = Number(yearParam);
    filters.searchYear = parseYear(year) ?? undefined;
  }

  const department = searchParams.get("searchDepartment");
  if (department && department !== "all") {
    filters.searchDepartment = parseDepartment(department) ?? undefined;
  }

  const type = searchParams.get("searchType");
  if (type && type !== "all") {
    filters.searchType = parseType(type) ?? undefined;
  }

  return { page, filters };
}

export async function listAnnouncements(
  page: number,
  filters: AnnouncementFilters,
) {
  const { items, total } = await queryAnnouncements(filters, page);
  return {
    items: await Promise.all(
      items.map((item) => serializeAnnouncement(item as AnnouncementRecord)),
    ),
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  };
}

export async function fetchAnnouncement(id: string) {
  validateAnnouncementId(id);
  const announcement = await getAnnouncementById(id);
  if (!announcement) throw new NotFoundError("Announcement not found.");
  return serializeAnnouncement(announcement);
}

export async function createAnnouncement(
  authorId: string,
  body: unknown,
  files: File[],
) {
  const payload = parseObjectBody(body);
  const name = parseRequiredText(payload.name, "Name");
  const description = parseRequiredText(payload.description, "Description");
  const year = parseYear(payload.year);
  const department = parseDepartment(payload.department);
  const type = parseType(payload.type);
  const announcementId = randomUUID();
  const uploadedFiles = files.length
    ? await uploadAnnouncementFiles(announcementId, files)
    : [];
  const data: AnnouncementUpdateData = {
    name,
    description,
    year,
    department,
    type,
    files: uploadedFiles,
  };

  try {
    const announcement = await insertAnnouncement(
      announcementId,
      authorId,
      data,
    );
    if (!announcement) {
      throw new NotFoundError("Failed to create announcement.");
    }
    return await serializeAnnouncement(announcement);
  } catch (error) {
    await removeAnnouncementFiles(
      uploadedFiles.map((file) => file.storagePath),
    ).catch((cleanupError) =>
      console.error("Failed to clean up announcement upload:", cleanupError),
    );
    throw error;
  }
}

export async function modifyAnnouncement(
  id: string,
  body: unknown,
  files: File[],
  replaceFiles: boolean,
) {
  validateAnnouncementId(id);
  const payload = parseObjectBody(body);
  const data: AnnouncementUpdateData = {};

  if ("name" in payload) data.name = parseRequiredText(payload.name, "Name");
  if ("description" in payload)
    data.description = parseRequiredText(payload.description, "Description");
  if ("year" in payload) data.year = parseYear(payload.year);
  if ("department" in payload)
    data.department = parseDepartment(payload.department);
  if ("type" in payload) data.type = parseType(payload.type);
  if (replaceFiles) {
    data.files = files.length ? await uploadAnnouncementFiles(id, files) : [];
  }

  if (Object.keys(data).length === 0) {
    throw new BadRequestError("No valid update fields provided.");
  }

  const uploadedFiles = data.files ?? [];
  let result: Awaited<ReturnType<typeof updateAnnouncementById>>;
  try {
    result = await updateAnnouncementById(id, data);
  } catch (error) {
    await removeAnnouncementFiles(
      uploadedFiles.map((file) => file.storagePath),
    ).catch((cleanupError) =>
      console.error("Failed to clean up announcement upload:", cleanupError),
    );
    throw error;
  }

  if (!result?.announcement) {
    await removeAnnouncementFiles(
      uploadedFiles.map((file) => file.storagePath),
    ).catch((cleanupError) =>
      console.error("Failed to clean up announcement upload:", cleanupError),
    );
    throw new NotFoundError("Announcement not found.");
  }

  await removeAnnouncementFiles(result.removedStoragePaths).catch((error) =>
    console.error("Failed to remove replaced announcement files:", error),
  );
  return serializeAnnouncement(result.announcement);
}

export async function removeAnnouncement(id: string) {
  validateAnnouncementId(id);
  const announcement = await getAnnouncementForAdminById(id);
  if (!announcement) throw new NotFoundError("Announcement not found.");

  if (!(await deleteAnnouncementById(id))) {
    throw new NotFoundError("Announcement not found.");
  }

  const storagePaths = announcement.attachments
    .map((file) => file.storagePath)
    .filter((path): path is string => path !== null);
  await removeAnnouncementFiles(storagePaths).catch((error) =>
    console.error("Failed to remove deleted announcement files:", error),
  );
}
