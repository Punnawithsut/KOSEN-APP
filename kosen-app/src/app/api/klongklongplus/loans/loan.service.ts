import { and, eq, inArray, isNull } from "drizzle-orm";
import { itemTypeEnum, loanStatusEnum, loans } from "@/db/schema";
import {
  AppError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../_shared/errors";
import { parsePageQuery } from "../../_shared/pagination";
import { MAX_APPROVED_LOANS_PER_TERM } from "./loan-quota";
import * as loanRepo from "./loan.repo";
import * as unitRepo from "../units/unit.repo";
import * as termRepo from "../terms/term.repo";
import { serializeTermDates } from "../terms/term.service";
import * as profileService from "../../profile/profile.service";

export type LoanStatus = (typeof loanStatusEnum.enumValues)[number];
export type ItemType = (typeof itemTypeEnum.enumValues)[number];

export type LoanFilters = {
  status?: LoanStatus;
  itemType?: ItemType;
  slotDate?: string; // YYYY-MM-DD
  slotId?: string;
  unitSearch?: string;
  borrowerId?: string;
  searchName?: string;
  mine?: boolean; // only loans this admin is responsible for ("งานของฉัน")
};

export type CreateUserLoanData = {
  unitId: string;
  itemType?: ItemType;
  termId: string;
  slotId: string;
  slotDate: string;
  returnNote: string | null;
};

export type UpdateUserLoanData = {
  termId?: string;
  slotId?: string;
  slotDate?: string;
  returnNote?: string | null;
};

function buildLoanWhere(filters: LoanFilters, adminId?: string) {
  return and(
    filters.status ? eq(loans.status, filters.status) : undefined,
    filters.itemType ? eq(loans.itemType, filters.itemType) : undefined,
    filters.slotDate ? eq(loans.slotDate, filters.slotDate) : undefined,
    filters.slotId ? eq(loans.slotId, filters.slotId) : undefined,
    filters.borrowerId ? eq(loans.borrowerId, filters.borrowerId) : undefined,
    filters.mine && adminId ? eq(loans.approvedBy, adminId) : undefined,
  );
}

/** Parse ?status=&itemType=&slotDate=&slotId=&borrowerId=&mine=&page= from the admin loans list query string. */
export function parseListQuery(searchParams: URLSearchParams) {
  const page = parsePageQuery(searchParams, { pageSize: loanRepo.PAGE_SIZE });

  const status = searchParams.get("status");
  const itemType = searchParams.get("itemType");
  const mine = searchParams.get("mine");
  if (status && !loanStatusEnum.enumValues.includes(status as LoanStatus)) {
    throw new BadRequestError(
      `status must be one of: ${loanStatusEnum.enumValues.join(", ")}`,
    );
  }
  if (itemType && !itemTypeEnum.enumValues.includes(itemType as ItemType)) {
    throw new BadRequestError(
      `itemType must be one of: ${itemTypeEnum.enumValues.join(", ")}`,
    );
  }
  if (mine !== null && mine !== "true" && mine !== "false") {
    throw new BadRequestError("mine must be true or false");
  }

  const filters: LoanFilters = {
    status: status ? (status as LoanStatus) : undefined,
    itemType: itemType ? (itemType as ItemType) : undefined,
    slotDate: searchParams.has("slotDate")
      ? parseSlotDate(searchParams.get("slotDate"))
      : undefined,
    slotId: searchParams.has("slotId")
      ? parseUuid(searchParams.get("slotId"), "slotId")
      : undefined,
    borrowerId: searchParams.has("borrowerId")
      ? parseUuid(searchParams.get("borrowerId"), "borrowerId")
      : undefined,
    unitSearch: searchParams.get("unitSearch")?.trim() || undefined,
    searchName: searchParams
      .get("searchName")
      ?.trim()
      .replace(/\s+/g, " ")
      .toLocaleLowerCase(),
    mine: mine === "true",
  };

  return { page, filters };
}

export async function listLoans(
  filters: LoanFilters,
  page: number,
  adminId?: string,
) {
  const where = buildLoanWhere(filters, adminId);
  const { items, total } = await loanRepo.findLoans(
    where,
    page,
    filters.searchName,
    filters.unitSearch,
  );
  return {
    items: items.map((item) => ({
      ...item,
      term: item.term ? serializeTermDates(item.term) : item.term,
    })),
    total,
    page,
    pageSize: loanRepo.PAGE_SIZE,
  };
}

export function parseMyLoansQuery(searchParams: URLSearchParams) {
  const page = parsePageQuery(searchParams, { pageSize: loanRepo.PAGE_SIZE });
  const status = searchParams.get("status");
  const itemType = searchParams.get("itemType");

  if (status && !loanStatusEnum.enumValues.includes(status as LoanStatus)) {
    throw new BadRequestError(
      `status must be one of: ${loanStatusEnum.enumValues.join(", ")}`,
    );
  }
  if (itemType && !itemTypeEnum.enumValues.includes(itemType as ItemType)) {
    throw new BadRequestError(
      `itemType must be one of: ${itemTypeEnum.enumValues.join(", ")}`,
    );
  }

  return {
    page,
    filters: {
      status: status ? (status as LoanStatus) : undefined,
      itemType: itemType ? (itemType as ItemType) : undefined,
      slotDate: searchParams.has("slotDate")
        ? parseSlotDate(searchParams.get("slotDate"))
        : undefined,
      slotId: searchParams.has("slotId")
        ? parseUuid(searchParams.get("slotId"), "slotId")
        : undefined,
      unitSearch: searchParams.get("unitSearch")?.trim() || undefined,
    },
  };
}

export async function listUserLoans(
  userId: string,
  page: number,
  filters: Pick<LoanFilters, "status" | "itemType" | "slotDate" | "slotId" | "unitSearch"> = {},
) {
  const { items, total } = await loanRepo.findUserLoans(userId, page, filters);
  return {
    items: items.map((item) => ({
      ...item,
      term: item.term ? serializeTermDates(item.term) : item.term,
    })),
    total,
    page,
    pageSize: loanRepo.PAGE_SIZE,
  };
}

export async function getLoanById(id: string) {
  const loan = await loanRepo.findLoanById(id);
  return loan
    ? {
        ...loan,
        term: loan.term ? serializeTermDates(loan.term) : loan.term,
      }
    : loan;
}

function parseObject(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new BadRequestError("Invalid request body");
  }
  return raw as Record<string, unknown>;
}

function parseUuid(value: unknown, field: string): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw new BadRequestError(`Field "${field}" must be a UUID`);
  }
  return value;
}

function parseItemType(value: unknown, field: string): ItemType {
  if (
    typeof value !== "string" ||
    !itemTypeEnum.enumValues.includes(value as ItemType)
  ) {
    throw new BadRequestError(
      `Field "${field}" must be one of: ${itemTypeEnum.enumValues.join(", ")}`,
    );
  }
  return value as ItemType;
}

function parseSlotDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestError('Field "slotDate" must be a valid YYYY-MM-DD date');
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new BadRequestError('Field "slotDate" must be a valid YYYY-MM-DD date');
  }
  return value;
}

function parseReturnNote(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new BadRequestError('Field "returnNote" must be a string or null');
  }
  return value.trim() || null;
}

function rejectUnknownFields(
  data: Record<string, unknown>,
  allowedFields: string[],
) {
  const unsupported = Object.keys(data).find(
    (field) => !allowedFields.includes(field),
  );
  if (unsupported) {
    throw new BadRequestError(`Field "${unsupported}" cannot be provided`);
  }
}

export function parseCreateUserLoanData(raw: unknown): CreateUserLoanData {
  const data = parseObject(raw);
  rejectUnknownFields(data, [
    "unitId",
    "itemType",
    "termId",
    "slotId",
    "slotDate",
    "returnNote",
  ]);

  return {
    unitId: parseUuid(data.unitId, "unitId"),
    itemType:
      data.itemType === undefined
        ? undefined
        : parseItemType(data.itemType, "itemType"),
    termId: parseUuid(data.termId, "termId"),
    slotId: parseUuid(data.slotId, "slotId"),
    slotDate: parseSlotDate(data.slotDate),
    returnNote:
      data.returnNote === undefined ? null : parseReturnNote(data.returnNote),
  };
}

export function parseAvailableSlotsQuery(searchParams: URLSearchParams) {
  const excludeLoanId = searchParams.get("excludeLoanId");
  return {
    unitId: parseUuid(searchParams.get("unitId"), "unitId"),
    slotDate: parseSlotDate(searchParams.get("slotDate")),
    excludeLoanId: excludeLoanId
      ? parseUuid(excludeLoanId, "excludeLoanId")
      : undefined,
  };
}

function getScheduledStartAt(slotDate: string, startTime: string) {
  const normalizedStartTime = startTime.replace(/(\.\d{3})\d+$/, "$1");
  return new Date(`${slotDate}T${normalizedStartTime}+07:00`);
}

export async function getAvailableSlots(
  userId: string,
  unitId: string,
  slotDate: string,
  excludeLoanId?: string,
) {
  if (excludeLoanId) {
    const loan = await loanRepo.findLoanById(excludeLoanId);
    if (!loan) throw new NotFoundError("Loan not found");
    if (loan.borrowerId !== userId && loan.createdBy !== userId) {
      throw new ForbiddenError("You can only check slots for your own loan");
    }
    if (loan.status !== "pending") {
      throw new BadRequestError("Only pending loan requests can be edited");
    }
    if (loan.unitId !== unitId) {
      throw new BadRequestError("The selected unit does not match the loan");
    }
  }

  const unit = await unitRepo.findUnitById(unitId);
  if (!unit || unit.deletedAt) throw new NotFoundError("Unit not found");
  if (!unit.isActive || unit.status !== "available") {
    throw new AppError("This unit is currently unavailable", 409);
  }

  const requestedDate = new Date(`${slotDate}T00:00:00.000Z`);
  const term = await termRepo.findCurrentTerm(requestedDate);
  if (!term) {
    throw new BadRequestError("The requested date is outside an active term");
  }
  if (slotDate < bangkokDate(new Date())) {
    throw new BadRequestError("Bookings cannot be made for past dates");
  }

  const now = new Date();
  const slots = await loanRepo.findAvailableSlots(
    unitId,
    slotDate,
    isExamDate(slotDate, term) ? "exam" : "normal",
    excludeLoanId,
  );
  return slots.filter((slot) => {
    const scheduledAt = getScheduledStartAt(slotDate, slot.startTime);
    return (
      !Number.isNaN(scheduledAt.getTime()) &&
      scheduledAt > now &&
      scheduledAt.getTime() - now.getTime() >= slot.leadMin * 60_000
    );
  });
}

function isExamDate(
  slotDate: string,
  term: NonNullable<Awaited<ReturnType<typeof termRepo.findCurrentTerm>>>,
) {
  const dateOnly = (date: Date | null) =>
    date?.toISOString().slice(0, 10) ?? null;
  const isWithinPeriod = (start: Date | null, end: Date | null) => {
    const startDate = dateOnly(start);
    const endDate = dateOnly(end);
    return startDate !== null && endDate !== null &&
      slotDate >= startDate && slotDate <= endDate;
  };
  return (
    isWithinPeriod(term.midtermStartDate, term.midtermEndDate) ||
    isWithinPeriod(term.finalExamStartDate, term.finalExamEndDate)
  );
}

export function parseUpdateUserLoanData(raw: unknown): UpdateUserLoanData {
  const data = parseObject(raw);
  if (Object.hasOwn(data, "unitId")) {
    throw new BadRequestError(
      "The unit cannot be changed; delete this request and create a new one",
    );
  }
  rejectUnknownFields(data, ["termId", "slotId", "slotDate", "returnNote"]);
  if (!Object.keys(data).length) {
    throw new BadRequestError("At least one editable field is required");
  }

  const update: UpdateUserLoanData = {};
  if (data.termId !== undefined) update.termId = parseUuid(data.termId, "termId");
  if (data.slotId !== undefined) update.slotId = parseUuid(data.slotId, "slotId");
  if (data.slotDate !== undefined)
    update.slotDate = parseSlotDate(data.slotDate);
  if (Object.hasOwn(data, "returnNote"))
    update.returnNote = parseReturnNote(data.returnNote);

  return update;
}

function getUniqueViolationConstraint(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  if (
    "code" in error &&
    error.code === "23505" &&
    "constraint" in error &&
    typeof error.constraint === "string"
  ) {
    return error.constraint;
  }
  if ("cause" in error && error.cause !== error) {
    return getUniqueViolationConstraint(error.cause);
  }
  return null;
}

function throwIfUniqueViolation(error: unknown): never {
  const constraint = getUniqueViolationConstraint(error);
  if (constraint === "loans_unit_slot_active_uq") {
    throw new AppError(
      "This unit has already been reserved for the requested date and time slot. Please choose another slot.",
      409,
    );
  }
  if (constraint === "loans_calc_per_day_uq") {
    throw new AppError(
      "You already have a calculator request for this date. Please choose another date.",
      409,
    );
  }
  throw error;
}

function bangkokDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

async function requireCompleteProfile(userId: string) {
  const profile = await profileService.fetchUserProfile(userId);
  const requiredFields = [
    ["studentId", profile.studentId],
    ["firstName", profile.firstName],
    ["lastName", profile.lastName],
    ["phone", profile.phone],
    ["email", profile.email],
    ["department", profile.department],
    ["year", profile.year],
    ["dormBuilding", profile.dormBuilding],
    ["dormRoom", profile.dormRoom],
  ] as const;
  const missingFields = requiredFields
    .filter(([, value]) =>
      typeof value === "string" ? !value.trim() : value === null,
    )
    .map(([field]) => field);

  if (missingFields.length > 0) {
    throw new BadRequestError(
      `Complete your profile before requesting a loan. Missing: ${missingFields.join(", ")}`,
    );
  }
}

async function validateBookingDateAndReferences(
  termId: string,
  slotId: string,
  slotDate: string,
) {
  const { term, slot } = await loanRepo.findBookingDetails(termId, slotId);
  if (!term) throw new NotFoundError("Term not found");
  if (!slot) throw new NotFoundError("Time slot not found");
  if (term.deletedAt || slot.deletedAt || !slot.isActive) {
    throw new BadRequestError("The selected term or time slot is inactive");
  }
  const requestedDate = new Date(`${slotDate}T00:00:00.000Z`);
  if (
    requestedDate.getTime() < term.startDate.getTime() ||
    requestedDate.getTime() > term.endDate.getTime()
  ) {
    throw new BadRequestError("The requested date is outside the selected term");
  }
  const shouldUseExamSlots = isExamDate(slotDate, term);
  if (slot.kind !== (shouldUseExamSlots ? "exam" : "normal")) {
    throw new BadRequestError(
      `The selected time slot must be a ${shouldUseExamSlots ? "exam" : "normal"} slot for the requested date`,
    );
  }

  const scheduledAt = getScheduledStartAt(slotDate, slot.startTime);
  const now = new Date();
  if (
    slotDate < bangkokDate(now) ||
    Number.isNaN(scheduledAt.getTime()) ||
    scheduledAt <= now
  ) {
    throw new BadRequestError("Bookings cannot be made for past dates or times");
  }
  if (scheduledAt.getTime() - now.getTime() < slot.leadMin * 60_000) {
    throw new BadRequestError(
      `Bookings must be made at least ${slot.leadMin} minutes before the slot starts`,
    );
  }
}

async function validateTermLoanQuota(
  borrowerId: string,
  termId: string,
  excludeLoanId?: string,
) {
  const inUse = await loanRepo.countTermLoanQuotaSlotsInUse(
    borrowerId,
    termId,
    excludeLoanId,
  );
  if (inUse >= MAX_APPROVED_LOANS_PER_TERM) {
    throw new AppError(
      `You already have ${MAX_APPROVED_LOANS_PER_TERM} approved or pending equipment loan requests for this term`,
      409,
    );
  }
}

export async function createUserLoan(
  userId: string,
  data: CreateUserLoanData,
) {
  await requireCompleteProfile(userId);
  await validateBookingDateAndReferences(data.termId, data.slotId, data.slotDate);
  await validateTermLoanQuota(userId, data.termId);

  try {
    const result = await loanRepo.createUserLoan({
      ...data,
      borrowerId: userId,
      createdBy: userId,
    });
    if (result.kind === "unit_not_found") {
      throw new NotFoundError("Unit not found");
    }
    if (result.kind === "unit_unavailable") {
      throw new AppError(
        "This unit is unavailable or already reserved for the requested date and time slot",
        409,
      );
    }
    if (result.kind === "quota_exceeded") {
      throw new AppError(
        `You already have ${MAX_APPROVED_LOANS_PER_TERM} approved or pending equipment loan requests for this term`,
        409,
      );
    }
    if (result.kind === "unit_type_mismatch") {
      throw new BadRequestError("The selected unit does not match itemType");
    }
    return result.loan;
  } catch (error) {
    throwIfUniqueViolation(error);
  }
}

export async function updateUserLoan(
  id: string,
  userId: string,
  data: UpdateUserLoanData,
) {
  const existing = await loanRepo.findLoanById(id);
  if (!existing) throw new NotFoundError("Loan not found");
  if (existing.borrowerId !== userId && existing.createdBy !== userId) {
    throw new ForbiddenError("You can only edit your own loan requests");
  }
  if (existing.status !== "pending") {
    throw new BadRequestError("Only pending loan requests can be edited");
  }

  await requireCompleteProfile(userId);

  const termId = data.termId ?? existing.termId;
  const slotId = data.slotId ?? existing.slotId;
  const slotDate = data.slotDate ?? existing.slotDate;
  await validateBookingDateAndReferences(termId, slotId, slotDate);
  await validateTermLoanQuota(existing.borrowerId, termId, id);

  try {
    const result = await loanRepo.updateUserLoan(id, userId, data);
    if (result.kind === "not_found") throw new NotFoundError("Loan not found");
    if (result.kind === "not_owner") {
      throw new ForbiddenError("You can only edit your own loan requests");
    }
    if (result.kind === "not_pending") {
      throw new BadRequestError("Only pending loan requests can be edited");
    }
    if (result.kind === "unit_not_found") throw new NotFoundError("Unit not found");
    if (result.kind === "quota_exceeded") {
      throw new AppError(
        `You already have ${MAX_APPROVED_LOANS_PER_TERM} approved or pending equipment loan requests for this term`,
        409,
      );
    }
    if (result.kind === "unit_unavailable") {
      throw new AppError(
        "This unit is unavailable or already reserved for the requested date and time slot",
        409,
      );
    }
    return result.loan;
  } catch (error) {
    throwIfUniqueViolation(error);
  }
}

export async function deleteUserLoan(id: string, userId: string) {
  const existing = await loanRepo.findLoanById(id);
  if (!existing) throw new NotFoundError("Loan not found");
  if (existing.borrowerId !== userId && existing.createdBy !== userId) {
    throw new ForbiddenError("You can only delete your own loan requests");
  }
  if (existing.status !== "pending") {
    throw new BadRequestError("Only pending loan requests can be deleted");
  }

  const deleted = await loanRepo.deleteUserLoan(id, userId);
  if (!deleted) {
    const current = await loanRepo.findLoanById(id);
    if (!current) throw new NotFoundError("Loan not found");
    if (current.borrowerId !== userId && current.createdBy !== userId) {
      throw new ForbiddenError("You can only delete your own loan requests");
    }
    throw new BadRequestError("Only pending loan requests can be deleted");
  }
}

async function requireLoan(id: string) {
  const loan = await loanRepo.findLoanById(id);
  if (!loan) throw new NotFoundError("Loan not found");
  return loan;
}

/** Free the unit tied to a loan back to `available`. Called whenever a loan leaves active use. */
async function releaseUnit(unitId: string) {
  await unitRepo.updateUnitById(unitId, {
    status: "available",
    updatedAt: new Date(),
  });
}

/**
 * pending -> approved. Approval consumes one quota use for the borrower and
 * term; the approving admin becomes the loan's responsible admin.
 */
export async function approveLoan(loanId: string, adminId: string) {
  const approvedAt = new Date();
  const result = await loanRepo.approveLoanWithinQuota(
    loanId,
    adminId,
    approvedAt,
  );

  if (result.kind === "approved") return result.loan;
  if (result.kind === "quota_exceeded") {
    throw new AppError(
      `The borrower has reached the maximum of ${MAX_APPROVED_LOANS_PER_TERM} approved equipment loans for this term`,
      409,
    );
  }
  if (result.kind === "not_found") throw new NotFoundError("Loan not found");

  const existing = await requireLoan(loanId);
  throw new AppError(
    `Cannot approve a loan with status "${existing.status}" (already handled, or not pending)`,
    409,
  );
}

/** pending -> rejected. Requires a reason. The unit was never marked `out`, so nothing to release. */
export async function rejectLoan(
  loanId: string,
  adminId: string,
  reason: string,
) {
  if (!reason?.trim()) {
    throw new BadRequestError('Field "reason" is required');
  }

  const updated = await loanRepo.updateLoanWhere(
    and(eq(loans.id, loanId), eq(loans.status, "pending")),
    {
      status: "rejected",
      rejectReason: reason.trim(),
      updatedAt: new Date(),
    },
  );

  if (!updated) {
    const existing = await requireLoan(loanId);
    throw new AppError(
      `Cannot reject a loan with status "${existing.status}" (only pending loans can be rejected)`,
      409,
    );
  }

  return updated;
}

/**
 * approved -> delivered. Only the admin who approved it may hand the item
 * over at the pickup room (requirements §3.5).
 */
export async function deliverLoan(
  loanId: string,
  adminId: string,
  conditionOut?: string,
) {
  const updated = await loanRepo.updateLoanWhere(
    and(
      eq(loans.id, loanId),
      eq(loans.status, "approved"),
      eq(loans.approvedBy, adminId),
    ),
    {
      status: "delivered",
      deliveredAt: new Date(),
      conditionOut: conditionOut ?? null,
      updatedAt: new Date(),
    },
  );

  if (!updated) {
    const existing = await requireLoan(loanId);
    if (existing.status !== "approved") {
      throw new AppError(
        `Cannot mark delivered from status "${existing.status}"`,
        409,
      );
    }
    throw new ForbiddenError(
      "Only the admin who approved this loan can hand over the item",
    );
  }

  return updated;
}

/**
 * delivered/overdue -> returned. Only the approving admin confirms the
 * return; the unit goes back to `available`.
 */
export async function returnLoan(
  loanId: string,
  adminId: string,
  conditionIn?: string,
) {
  const updated = await loanRepo.updateLoanWhere(
    and(
      eq(loans.id, loanId),
      inArray(loans.status, ["delivered", "overdue"]),
      eq(loans.approvedBy, adminId),
    ),
    {
      status: "returned",
      returnedAt: new Date(),
      conditionIn: conditionIn ?? null,
      updatedAt: new Date(),
    },
  );

  if (!updated) {
    const existing = await requireLoan(loanId);
    if (!["delivered", "overdue"].includes(existing.status)) {
      throw new AppError(
        `Cannot mark returned from status "${existing.status}"`,
        409,
      );
    }
    throw new ForbiddenError(
      "Only the admin who approved this loan can confirm the return",
    );
  }

  await releaseUnit(updated.unitId);
  return updated;
}

/** approved -> no_show. Only the approving admin; still counts toward quota (requirements §3.4). */
export async function markNoShow(loanId: string, adminId: string) {
  const updated = await loanRepo.updateLoanWhere(
    and(
      eq(loans.id, loanId),
      eq(loans.status, "approved"),
      eq(loans.approvedBy, adminId),
    ),
    { status: "no_show", updatedAt: new Date() },
  );

  if (!updated) {
    const existing = await requireLoan(loanId);
    if (existing.status !== "approved") {
      throw new AppError(
        `Cannot mark no-show from status "${existing.status}"`,
        409,
      );
    }
    throw new ForbiddenError(
      "Only the admin who approved this loan can mark it as no-show",
    );
  }

  await releaseUnit(updated.unitId);
  return updated;
}

/** approved -> cancelled, by the approving admin, with a reason. */
export async function cancelLoanByAdmin(
  loanId: string,
  adminId: string,
  reason: string,
) {
  if (!reason?.trim()) {
    throw new BadRequestError('Field "reason" is required');
  }

  const updated = await loanRepo.updateLoanWhere(
    and(
      eq(loans.id, loanId),
      eq(loans.status, "approved"),
      eq(loans.approvedBy, adminId),
    ),
    {
      status: "cancelled",
      cancelReason: reason.trim(),
      updatedAt: new Date(),
    },
  );

  if (!updated) {
    const existing = await requireLoan(loanId);
    if (existing.status !== "approved") {
      throw new AppError(
        `Cannot cancel a loan with status "${existing.status}"`,
        409,
      );
    }
    throw new ForbiddenError(
      "Only the admin who approved this loan can cancel it",
    );
  }

  await releaseUnit(updated.unitId);
  return updated;
}

/**
 * "ปล่อยงาน" — the responsible admin steps back without changing the loan's
 * status, so another admin can pick it up with reassignLoan below.
 */
export async function releaseLoan(loanId: string, adminId: string) {
  const updated = await loanRepo.updateLoanWhere(
    and(
      eq(loans.id, loanId),
      eq(loans.status, "approved"),
      eq(loans.approvedBy, adminId),
    ),
    { approvedBy: null, approvedAt: null, updatedAt: new Date() },
  );

  if (!updated) {
    const existing = await requireLoan(loanId);
    if (existing.status !== "approved") {
      throw new AppError(
        `Cannot release a loan with status "${existing.status}"`,
        409,
      );
    }
    throw new ForbiddenError(
      "Only the admin currently responsible for this loan can release it",
    );
  }

  return updated;
}

/** "รับช่วงต่อ" — any admin can claim an approved loan that has no responsible admin right now. */
export async function reassignLoan(loanId: string, adminId: string) {
  const updated = await loanRepo.updateLoanWhere(
    and(
      eq(loans.id, loanId),
      eq(loans.status, "approved"),
      isNull(loans.approvedBy),
    ),
    { approvedBy: adminId, approvedAt: new Date(), updatedAt: new Date() },
  );

  if (!updated) {
    const existing = await requireLoan(loanId);
    if (existing.status !== "approved") {
      throw new AppError(
        `Cannot pick up a loan with status "${existing.status}"`,
        409,
      );
    }
    throw new AppError("This loan already has a responsible admin", 409);
  }

  return updated;
}

export function parseReasonBody(raw: unknown): string {
  const reason =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>).reason
      : undefined;

  if (typeof reason !== "string" || !reason.trim()) {
    throw new BadRequestError('Field "reason" is required');
  }

  return reason.trim();
}

export function parseConditionBody(raw: unknown): string | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const condition = (raw as Record<string, unknown>).condition;
  return typeof condition === "string" && condition.trim()
    ? condition.trim()
    : undefined;
}
