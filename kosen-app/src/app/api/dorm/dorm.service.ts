import * as wardensService from "./dormwardens/dormwardens.service";
import * as formsService from "./forms/forms.service";
import * as rulesService from "./rule/rule.service";
import { getHandbookMetadata } from "./handbook/handbook.repo";

const AUDIT_FIELDS = ["createdBy", "updatedBy", "deletedBy", "deletedAt", "updatedAt", "createdAt"] as const;
function stripAudit<T extends Record<string, unknown>>(item: T): T {
  const rest = { ...item };
  for (const field of AUDIT_FIELDS) delete rest[field];
  return rest;
}

export async function getDormDashboard() {
  const [wardens, forms, rules, handbook] = await Promise.all([
    wardensService.listWardens({}),
    formsService.listForms({}),
    rulesService.listRules(undefined, {}),
    getHandbookMetadata(),
  ]);
  return { wardens: wardens.items.map(stripAudit), forms: forms.items.map(stripAudit), rules: rules.items.map(stripAudit), handbook };
}
