import { AppError, BadRequestError, NotFoundError } from "../../_shared/errors";
import { parsePageQuery } from "../../_shared/pagination";
import * as termRepo from "./term.repo";

export type TermData = {
  name: string;
  startDate: Date;
  endDate: Date;
  midtermStartDate: Date | null;
  midtermEndDate: Date | null;
  finalExamStartDate: Date | null;
  finalExamEndDate: Date | null;
};

export type TermUpdateData = Partial<TermData>;

type TermDates = Pick<
  TermData,
  | "startDate"
  | "endDate"
  | "midtermStartDate"
  | "midtermEndDate"
  | "finalExamStartDate"
  | "finalExamEndDate"
>;

export function serializeTermDates<T extends TermDates>(term: T) {
  const serializeDate = (date: Date | null) =>
    date?.toISOString().slice(0, 10) ?? null;
  return {
    ...term,
    startDate: serializeDate(term.startDate),
    endDate: serializeDate(term.endDate),
    midtermStartDate: serializeDate(term.midtermStartDate),
    midtermEndDate: serializeDate(term.midtermEndDate),
    finalExamStartDate: serializeDate(term.finalExamStartDate),
    finalExamEndDate: serializeDate(term.finalExamEndDate),
  };
}

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

function parseDate(raw: unknown, field: string): Date {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new BadRequestError(`Field "${field}" must use YYYY-MM-DD format`);
  }
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) {
    throw new BadRequestError(`Field "${field}" must be a valid date`);
  }
  return date;
}

function parseNullableDate(raw: unknown, field: string): Date | null {
  return raw === null ? null : parseDate(raw, field);
}

function validateDateRange(
  startDate: Date,
  endDate: Date,
  label = "startDate",
) {
  if (startDate.getTime() > endDate.getTime()) {
    throw new BadRequestError(`${label} must be on or before its end date`);
  }
}

function validateExamPeriod(
  label: string,
  startDate: Date | null,
  endDate: Date | null,
  termStartDate: Date,
  termEndDate: Date,
) {
  if ((startDate === null) !== (endDate === null)) {
    throw new BadRequestError(
      `${label} start and end dates must both be provided or both be null`,
    );
  }
  if (startDate === null || endDate === null) return;

  validateDateRange(startDate, endDate, `${label} start date`);
  if (
    startDate.getTime() < termStartDate.getTime() ||
    endDate.getTime() > termEndDate.getTime()
  ) {
    throw new BadRequestError(`${label} dates must fall within the term`);
  }
}

function validateTermDates(data: TermData) {
  validateDateRange(data.startDate, data.endDate);
  validateExamPeriod(
    "Midterm",
    data.midtermStartDate,
    data.midtermEndDate,
    data.startDate,
    data.endDate,
  );
  validateExamPeriod(
    "Final exam",
    data.finalExamStartDate,
    data.finalExamEndDate,
    data.startDate,
    data.endDate,
  );

  if (
    data.midtermStartDate &&
    data.midtermEndDate &&
    data.finalExamStartDate &&
    data.finalExamEndDate &&
    data.midtermStartDate.getTime() <= data.finalExamEndDate.getTime() &&
    data.finalExamStartDate.getTime() <= data.midtermEndDate.getTime()
  ) {
    throw new BadRequestError("Midterm and final exam date ranges cannot overlap");
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
  rejectUnknownFields(body, [
    "name",
    "startDate",
    "endDate",
    "midtermStartDate",
    "midtermEndDate",
    "finalExamStartDate",
    "finalExamEndDate",
  ]);
  const data = {
    name: parseName(body.name),
    startDate: parseDate(body.startDate, "startDate"),
    endDate: parseDate(body.endDate, "endDate"),
    midtermStartDate:
      body.midtermStartDate === undefined
        ? null
        : parseNullableDate(body.midtermStartDate, "midtermStartDate"),
    midtermEndDate:
      body.midtermEndDate === undefined
        ? null
        : parseNullableDate(body.midtermEndDate, "midtermEndDate"),
    finalExamStartDate:
      body.finalExamStartDate === undefined
        ? null
        : parseNullableDate(body.finalExamStartDate, "finalExamStartDate"),
    finalExamEndDate:
      body.finalExamEndDate === undefined
        ? null
        : parseNullableDate(body.finalExamEndDate, "finalExamEndDate"),
  };
  validateTermDates(data);
  return data;
}

export function parseUpdateTerm(raw: unknown): TermUpdateData {
  const body = parseObject(raw);
  rejectUnknownFields(body, [
    "name",
    "startDate",
    "endDate",
    "midtermStartDate",
    "midtermEndDate",
    "finalExamStartDate",
    "finalExamEndDate",
  ]);
  if (Object.keys(body).length === 0) {
    throw new BadRequestError("At least one update field is required");
  }

  const data: TermUpdateData = {};
  if (body.name !== undefined) data.name = parseName(body.name);
  if (body.startDate !== undefined)
    data.startDate = parseDate(body.startDate, "startDate");
  if (body.endDate !== undefined)
    data.endDate = parseDate(body.endDate, "endDate");
  if (body.midtermStartDate !== undefined)
    data.midtermStartDate = parseNullableDate(
      body.midtermStartDate,
      "midtermStartDate",
    );
  if (body.midtermEndDate !== undefined)
    data.midtermEndDate = parseNullableDate(
      body.midtermEndDate,
      "midtermEndDate",
    );
  if (body.finalExamStartDate !== undefined)
    data.finalExamStartDate = parseNullableDate(
      body.finalExamStartDate,
      "finalExamStartDate",
    );
  if (body.finalExamEndDate !== undefined)
    data.finalExamEndDate = parseNullableDate(
      body.finalExamEndDate,
      "finalExamEndDate",
    );
  return data;
}

export function parseListQuery(searchParams: URLSearchParams) {
  const page = parsePageQuery(searchParams, { pageSize: termRepo.PAGE_SIZE });
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

function bangkokDate(now: Date): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return new Date(`${part("year")}-${part("month")}-${part("day")}T00:00:00.000Z`);
}

export async function getCurrentTerm() {
  const term = await termRepo.findCurrentTerm(bangkokDate(new Date()));
  if (!term) throw new NotFoundError("No current term found");
  return term;
}

export async function createTerm(data: TermData, userId: string) {
  if (await termRepo.hasDateOverlap(data.startDate, data.endDate)) {
    throw new BadRequestError("Term date range overlaps with another term");
  }

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
  validateTermDates({
    name: data.name ?? existing.name,
    startDate,
    endDate,
    midtermStartDate: data.midtermStartDate === undefined
      ? existing.midtermStartDate
      : data.midtermStartDate,
    midtermEndDate: data.midtermEndDate === undefined
      ? existing.midtermEndDate
      : data.midtermEndDate,
    finalExamStartDate: data.finalExamStartDate === undefined
      ? existing.finalExamStartDate
      : data.finalExamStartDate,
    finalExamEndDate: data.finalExamEndDate === undefined
      ? existing.finalExamEndDate
      : data.finalExamEndDate,
  });

  if (
    (data.startDate !== undefined || data.endDate !== undefined) &&
    (await termRepo.hasDateOverlap(startDate, endDate, id))
  ) {
    throw new BadRequestError("Term date range overlaps with another term");
  }

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
  if (await termRepo.hasActiveLoanReferences(id)) {
    throw new AppError(
      "Term is referenced by loan requests and cannot be deleted",
      409,
    );
  }
  if (!(await termRepo.softDeleteTerm(id, userId))) {
    throw new NotFoundError("Term not found");
  }
}
