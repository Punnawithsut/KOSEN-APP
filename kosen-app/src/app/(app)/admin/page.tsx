import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/role";

export default async function AdminHomeAlias() {
  await requireAdmin();
  redirect("/klongklongplus/admin");
}
