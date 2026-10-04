import { RequireStandalone } from "@/components/require-standalone";
import { isLoggedIn } from "@/lib/auth/role";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isLoggedIn())) {
    redirect("/login");
  }

  return <RequireStandalone>{children}</RequireStandalone>;
}