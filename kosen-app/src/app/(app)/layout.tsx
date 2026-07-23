import { RequireStandalone } from "@/components/require-standalone";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <RequireStandalone>{children}</RequireStandalone>;
}