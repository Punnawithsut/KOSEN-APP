"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useIsStandalone } from "@/lib/use-standalone";

export function RequireStandalone({ children }: { children: React.ReactNode }) {
  const isStandalone = useIsStandalone();
  const router = useRouter();

  useEffect(() => {
    if (!isStandalone) {
      router.replace("/no-standalone");
    }
  }, [isStandalone, router]);

  // Standalone mode is only detectable in the browser, so keep the SSR content visible.
  return <>{children}</>;
}

/*
If you want to create page that require standanlone use the code below.

import { RequireStandalone } from "@/components/require-standalone";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <RequireStandalone>{children}</RequireStandalone>;
}
*/
