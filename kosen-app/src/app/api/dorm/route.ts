import { NextResponse } from "next/server";
import { withSessionMiddleware } from "../_shared/middleware";
import * as wardensService from "./dormwardens/dormwardens.service";
import * as formsService from "./forms/forms.service";
import * as rulesService from "./rule/rule.service";
import { getHandbookMetadata } from "./handbook/handbook.repo";

const AUDIT_FIELDS = [
  "createdBy",
  "updatedBy",
  "deletedBy",
  "deletedAt",
  "updatedAt",
  "createdAt",
] as const;

function stripAudit<T extends Record<string, unknown>>(item: T): T {
  const rest: Record<string, unknown> = { ...item };
  for (const field of AUDIT_FIELDS) {
    delete rest[field];
  }
  return rest as T;
}

/**
 * GET /api/dorm
 *
 * Aggregate dashboard endpoint that returns dorm wardens, forms, and rules
 * in a single response. Handbook is intentionally excluded.
 *
 * Audit fields (createdBy, updatedBy, deletedBy, deletedAt, updatedAt,
 * createdAt) are stripped from every item.
 */
export const GET = withSessionMiddleware(async () => {
  const [wardensResult, formsResult, rulesResult, handbook] = await Promise.all([
    wardensService.listWardens({}),
    formsService.listForms({}),
    rulesService.listRules(undefined, {}),
    getHandbookMetadata(),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      wardens: wardensResult.items.map(stripAudit),
      forms: formsResult.items.map(stripAudit),
      rules: rulesResult.items.map(stripAudit),
      handbook,
    },
  });
});
