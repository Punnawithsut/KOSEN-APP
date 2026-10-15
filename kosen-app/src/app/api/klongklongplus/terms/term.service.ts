import { AppError, BadRequestError, NotFoundError } from "../../_shared/errors";
import * as termRepo from "./term.repo";

export type TermData = {
  name: string;
  startDate: string;
  endDate: string;
};

export type TermUpdateData = Partial<TermData>;

function parseObject(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new BadRequestError("Request body must be an object");
  }
  return raw as Record<string, unknown>;
}

function parseName(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new BadRequestError('Field "name" is required');
  }
  const name = raw.trim();
  if (name.length > 100) {
    throw new BadRequestError('Field "name" must be 100 characters or fewer');
  }
  return name;
}

function parseDate(raw: unknown, field: string): string {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new BadRequestError(`Field "${field}" must use YYYY-MM-DD format`);
  }
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) {
    throw new BadRequestError(`Field "${field}" must be a valid date`);
  }
  return raw;
}

function validateDateRange(startDate: string, endDate: string) {
  if (startDate > endDate) {
    throw new BadRequestError("startDate must be on or before endDate");
  }
}

function rejectUnknownFields(
  body: Record<string, unknown>,
  allowed: string[],
) {
  const unknown = Object.keys(body).find((field) => !allowed.includes(field));
  if (unknown) throw new BadRequestError(`Field "${unknown}" is not allowed`);
}

export function parseCreateTerm(raw: unknown): TermData {
  const body = parseObject(raw);
  rejectUnknownFields(body, ["name", "startDate", "endDate"]);
  const data = {
    name: parseName(body.name),
    startDate: parseDate(body.startDate, "startDate"),
    endDate: parseDate(body.endDate, "endDate"),
  };
  validateDateRange(data.startDate, data.endDate);
  return data;
}

export function parseUpdateTerm(raw: unknown): TermUpdateData {
  const body = parseObject(raw);
  rejectUnknownFields(body, ["name", "startDate", "endDate"]);
  if (Object.keys(body).length === 0) {
    throw new BadRequestError("At least one update field is required");
  }

  const data: TermUpdateData = {};
  if (body.name !== undefined) data.name = parseName(body.name);
  if (body.startDate !== undefined)
    data.startDate = parseDate(body.startDate, "startDate");
  if (body.endDate !== undefined)
    data.endDate = parseDate(body.endDate, "endDate");
  return data;
}

export function parseListQuery(searchParams: URLSearchParams) {
  const rawPage = searchParams.get("page") ?? "1";
  const page = Number(rawPage);
  if (!Number.isInteger(page) || page < 1) {
    throw new BadRequestError("page must be a positive integer");
  }
  return {
    page,
    filters: { search: searchParams.get("search")?.trim() || undefined },
  };
}

export async function listTerms(page: number, search?: string) {
  const { items, total } = await termRepo.findTerms({ search }, page);
  return { items, total, page, pageSize: termRepo.PAGE_SIZE };
}

export async function getTerm(id: string) {
  const term = await termRepo.findTermById(id);
  if (!term) throw new NotFoundError("Term not found");
  return term;
}

export async function createTerm(data: TermData, userId: string) {
  return termRepo.insertTerm({
    ...data,
    createdBy: userId,
    updatedBy: userId,
  });
}

export async function updateTerm(
  id: string,
  data: TermUpdateData,
  userId: string,
) {
  const existing = await getTerm(id);
  const startDate = data.startDate ?? existing.startDate;
  const endDate = data.endDate ?? existing.endDate;
  validateDateRange(startDate, endDate);

  const updated = await termRepo.updateTermById(id, {
    ...data,
    updatedBy: userId,
    updatedAt: new Date(),
  });
  if (!updated) throw new NotFoundError("Term not found");
  return updated;
}

export async function deleteTerm(id: string, userId: string) {
  await getTerm(id);
  if (await termRepo.hasLoanReferences(id)) {
    throw new AppError(
      "Term is referenced by loan requests and cannot be deleted",
      409,
    );
  }
  if (!(await termRepo.softDeleteTerm(id, userId))) {
    throw new NotFoundError("Term not found");
  }
}
