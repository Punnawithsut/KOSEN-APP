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
        queryParams: { prompt: "select_account" },
      },
    });
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Sign in with Google</h1>

      {error === "unauthorized_email" && (
        <p className="text-red-600">
          This account isn&apos;t authorized. Use your KMITL account or the
          configured admin account.
        </p>
      )}
      {error === "auth_failed" && (
        <p className="text-red-600">
          Something went wrong signing in. Try again.
        </p>
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
