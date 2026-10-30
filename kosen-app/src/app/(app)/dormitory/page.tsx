import { DormitoryView } from "@/components/dormitory/dormitory-view";
import { isAdmin } from "@/lib/auth/role";
import { getDormDashboard } from "@/app/api/dorm/dorm.service";
import { serializeDates } from "@/lib/api/serialize-dates";

export const dynamic = "force-dynamic";

export default async function DormitoryPage() {
  let initialData = undefined;
  let admin = false;
  try {
    [admin] = await Promise.all([isAdmin()]);
    const data = await getDormDashboard();
    initialData = serializeDates<{ ok: true; data: typeof data }>({ ok: true as const, data });
  } catch (error) {
    console.error("[SSR Prefetch] Failed to prefetch dormitory:", error);
  }
  return (
    <div className="bg-bg-primary">
      <DormitoryView isAdmin={admin} initialData={initialData} />
    </div>
  );
}
