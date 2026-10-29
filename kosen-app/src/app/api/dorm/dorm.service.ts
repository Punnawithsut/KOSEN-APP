import * as wardensService from "./dormwardens/dormwardens.service";
import * as formsService from "./forms/forms.service";
import * as rulesService from "./rule/rule.service";
import { getHandbookMetadata } from "./handbook/handbook.repo";
import { createClient } from "@/lib/supabase/server";

const AUDIT_FIELDS = ["createdBy", "updatedBy", "deletedBy", "deletedAt", "createdAt"] as const;
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
  const paths = wardens.items.map((warden) => `staff/${warden.id}/photo`);
  const photoUrls = new Map<string, string>();
  if (paths.length) {
    const { data } = await (await createClient()).storage.from("dorm-files").createSignedUrls(paths, 60 * 60);
    for (const photo of data ?? []) if (!photo.error && photo.path && photo.signedUrl) photoUrls.set(photo.path, photo.signedUrl);
  }
  return { wardens: wardens.items.map((warden) => ({ ...stripAudit(warden), photoUrl: photoUrls.get(`staff/${warden.id}/photo`) ?? null })), forms: forms.items.map(stripAudit), rules: rules.items.map(stripAudit), handbook };
}
