import { AdminTermsPage } from "@/components/klongklongplus/admin-terms-page";
import { requireAdmin } from "@/lib/auth/role";

export default async function AdminTermsRoute() {
  await requireAdmin();
  return <AdminTermsPage />;
}
