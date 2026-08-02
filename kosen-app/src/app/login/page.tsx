"use client";

import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  async function handleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { 
          hd: "kmitl.ac.th",
          prompt: "select_account"
        },
      },
    });
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Sign in — KMITL only (test page)</h1>

      {error === "not_kmitl_domain" && (
        <p className="text-red-600">
          That account isn&apos;t a @kmitl.ac.th address. Try again with your school account.
        </p>
      )}
      {error === "auth_failed" && (
        <p className="text-red-600">Something went wrong signing in. Try again.</p>
      )}

      <button
        onClick={handleSignIn}
        className="rounded-md bg-black px-4 py-2 text-white hover:bg-neutral-800"
      >
        Sign in with Google
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}