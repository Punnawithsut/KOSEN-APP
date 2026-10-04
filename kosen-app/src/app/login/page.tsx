"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  async function handleSignIn() {
    console.log("Login button clicked...");
    
    try {
      const supabase = createClient();
      console.log("Supabase client created:", supabase);

      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log("Redirecting to:", redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: { 
            hd: "kmitl.ac.th",
            prompt: "select_account"
          },
        },
      });

      if (error) {
        console.error("Supabase OAuth Error:", error);
        alert(`OAuth Error: ${error.message}`);
        return;
      }

      if (!data.url) {
        throw new Error("Google sign-in did not return a redirect URL.");
      }

      window.location.assign(data.url);
    } catch (err) {
      console.error("Unexpected error during sign in:", err);
      alert(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return (
    <main className="min-h-screen bg-[#FFFDF9] lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden p-8 lg:flex lg:items-center lg:justify-center xl:p-12">
        <div className="absolute inset-5 rounded-[2rem] border border-dashed border-[#d9cfc1]" />
        <div className="relative flex h-full min-h-[calc(100vh-4rem)] w-full flex-col justify-between overflow-hidden rounded-[1.6rem] bg-[#f4efe6] p-10 xl:p-14">
          <div className="flex items-center gap-3 text-[#30352f]">
            <Image src="/icons/icon-192.png" width={40} height={40} alt="KOSEN Logo" className="rounded-xl" />
            <span className="text-sm font-semibold tracking-wide">KOSEN</span>
          </div>

          <div className="relative mx-auto flex size-[min(100%,20rem,38vh)] items-center justify-center">
            <div className="absolute inset-[12%] rounded-full border border-[#d9cfc1]" />
            <div className="absolute inset-[24%] rounded-full border border-dashed border-[#d9cfc1]" />
            <div className="absolute left-[13%] top-[23%] size-16 rounded-2xl bg-[#e5a46e]" />
            <div className="absolute bottom-[18%] right-[14%] size-24 rounded-full bg-[#b9c6a9]" />
          </div>

          <div className="max-w-md">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#a75a2a]">Campus life, connected</p>
            <h2 className="max-w-sm text-3xl font-semibold leading-tight text-[#30352f] xl:text-4xl">
              Your KOSEN community starts here.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#716d65]">
              One place for campus updates, events, and the people who make KMITL feel like home.
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex flex-col items-center gap-3 lg:mb-6">
              <Image src="/icons/icon-192.png" width={64} height={64} alt="KOSEN Logo" className="rounded-2xl" />
              <span className="text-sm font-semibold tracking-[0.18em] text-[#30352f] lg:hidden">KOSEN APP</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#292c28]">Login to your account</h1>
            <p className="mt-3 text-sm text-[#77736c]">Continue with your KMITL Google account</p>
          </div>

          {error === "not_kmitl_domain" && (
            <p role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              That account isn&apos;t a @kmitl.ac.th address. Try again with your school account.
            </p>
          )}
          {error === "auth_failed" && (
            <p role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Something went wrong signing in. Try again.
            </p>
          )}

          <Button
            type="button"
            onClick={() => void handleSignIn()}
            className="h-11 w-full bg-[#FA8132] text-sm font-semibold text-white hover:bg-[#e76e24]"
          >
            login with KMITL
          </Button>

          {/*
          <p className="mt-8 text-center text-xs leading-5 text-[#89857e]">
            By continuing, you agree to our{" "}
            <a href="/terms" className="underline underline-offset-4 transition-colors hover:text-[#a75a2a]">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" className="underline underline-offset-4 transition-colors hover:text-[#a75a2a]">Privacy Policy</a>.
          </p>
          */}
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
