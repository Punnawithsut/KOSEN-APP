import { RequireStandalone } from "@/components/require-standalone";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
  //return <RequireStandalone>{children}</RequireStandalone>;
}