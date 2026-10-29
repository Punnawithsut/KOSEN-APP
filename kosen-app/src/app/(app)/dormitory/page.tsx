import { DormitoryView } from "@/components/dormitory/dormitory-view";
import { isAdmin } from "@/lib/auth/role";
import * as wardensService from "@/app/api/dorm/dormwardens/dormwardens.service";
import * as formsService from "@/app/api/dorm/forms/forms.service";
import * as rulesService from "@/app/api/dorm/rule/rule.service";
import { getHandbookMetadata } from "@/app/api/dorm/handbook/handbook.repo";
import { serializeDates } from "@/lib/api/serialize-dates";

export default async function DormitoryPage() {
  let initialData = undefined;
  let admin = false;
  try {
    [admin] = await Promise.all([isAdmin()]);
    const [wardens, forms, rules, handbook] = await Promise.all([
      wardensService.listWardens({}),
      formsService.listForms({}),
      rulesService.listRules(undefined, {}),
      getHandbookMetadata(),
    ]);
    initialData = serializeDates<{ ok: true; data: { wardens: Record<string, unknown>[]; forms: Record<string, unknown>[]; rules: Record<string, unknown>[]; handbook: typeof handbook } }>({ ok: true as const, data: { wardens: wardens.items, forms: forms.items, rules: rules.items, handbook } });
  } catch (error) {
    console.error("[SSR Prefetch] Failed to prefetch dormitory:", error);
  }
  return <DormitoryView isAdmin={admin} initialData={initialData} />;
}
