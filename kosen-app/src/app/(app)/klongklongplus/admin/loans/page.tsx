import { AdminLoansPage } from "@/components/klongklongplus/admin-loans-page";
import { getCurrentUser, requireAdmin } from "@/lib/auth/role";
import { redirect } from "next/navigation";

export default async function AdminLoansRoute() {
  await requireAdmin();
  const admin = await getCurrentUser();
  if (!admin) redirect("/login");

  return <AdminLoansPage adminId={admin.userId} />;
}
