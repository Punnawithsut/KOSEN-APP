import { and, eq, inArray, isNull } from "drizzle-orm";
import { itemTypeEnum, loanStatusEnum, loans } from "@/db/schema";
import {
  AppError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../_shared/errors";
import * as loanRepo from "./loan.repo";
import * as unitRepo from "../units/unit.repo";

export type LoanStatus = (typeof loanStatusEnum.enumValues)[number];
export type ItemType = (typeof itemTypeEnum.enumValues)[number];

export type LoanFilters = {
  status?: LoanStatus;
  itemType?: ItemType;
  slotDate?: string; // YYYY-MM-DD
  slotId?: string;
  borrowerId?: string;
  mine?: boolean; // only loans this admin is responsible for ("งานของฉัน")
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
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const status = searchParams.get("status");
  const itemType = searchParams.get("itemType");

  const filters: LoanFilters = {
    status:
      status && loanStatusEnum.enumValues.includes(status as LoanStatus)
        ? (status as LoanStatus)
        : undefined,
    itemType:
      itemType && itemTypeEnum.enumValues.includes(itemType as ItemType)
        ? (itemType as ItemType)
        : undefined,
    slotDate: searchParams.get("slotDate") ?? undefined,
    slotId: searchParams.get("slotId") ?? undefined,
    borrowerId: searchParams.get("borrowerId") ?? undefined,
    mine: searchParams.get("mine") === "true",
  };

  return { page, filters };
}

export async function listLoans(
  filters: LoanFilters,
  page: number,
  adminId?: string,
) {
  const where = buildLoanWhere(filters, adminId);
  const { items, total } = await loanRepo.findLoans(where, page);
  return { items, total, page, pageSize: loanRepo.PAGE_SIZE };
}

export async function getLoanById(id: string) {
  return loanRepo.findLoanById(id);
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
 * pending -> approved. First admin to click wins (conditional update on
 * status = 'pending'); the approving admin becomes the loan's sole
 * responsible admin for the rest of its lifecycle (requirements §3.5).
 */
export async function approveLoan(loanId: string, adminId: string) {
  const updated = await loanRepo.updateLoanWhere(
    and(eq(loans.id, loanId), eq(loans.status, "pending")),
    {
      status: "approved",
      approvedBy: adminId,
      approvedAt: new Date(),
      updatedAt: new Date(),
    },
  );

  if (!updated) {
    const existing = await requireLoan(loanId);
    throw new AppError(
      `Cannot approve a loan with status "${existing.status}" (already handled, or not pending)`,
      409,
    );
  }

  return updated;
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
