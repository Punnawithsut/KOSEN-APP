import { AdminUnitsPage } from "@/components/klongklongplus/admin-units-page";
import { requireAdmin } from "@/lib/auth/role";

export default async function AdminUnitsRoute() {
  await requireAdmin();
  return <AdminUnitsPage />;
}
