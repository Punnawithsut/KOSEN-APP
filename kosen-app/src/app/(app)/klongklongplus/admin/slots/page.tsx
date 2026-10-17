import { AdminSlotsPage } from "@/components/klongklongplus/admin-slots-page";
import { requireAdmin } from "@/lib/auth/role";

export default async function AdminSlotsRoute() {
  await requireAdmin();
  return <AdminSlotsPage />;
}
