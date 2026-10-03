"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpRight, GraduationCap, Sparkles } from "lucide-react";
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
    <main className="min-h-screen bg-[#FFFDF9] lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden p-8 lg:flex lg:items-center lg:justify-center xl:p-12">
        <div className="absolute inset-5 rounded-[2rem] border border-dashed border-[#d9cfc1]" />
        <div className="relative flex h-full min-h-[calc(100vh-4rem)] w-full flex-col justify-between overflow-hidden rounded-[1.6rem] bg-[#f4efe6] p-10 xl:p-14">
          <div className="flex items-center gap-3 text-[#30352f]">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#FA8132] text-white">
              <GraduationCap aria-hidden="true" className="size-5" />
            </span>
            <span className="text-sm font-semibold tracking-wide">KOSEN</span>
          </div>

          <div className="relative mx-auto flex aspect-square w-full max-w-[26rem] items-center justify-center">
            <div className="absolute inset-[12%] rounded-full border border-[#d9cfc1]" />
            <div className="absolute inset-[24%] rounded-full border border-dashed border-[#d9cfc1]" />
            <div className="absolute left-[13%] top-[23%] size-16 rounded-2xl bg-[#e5a46e]" />
            <div className="absolute bottom-[18%] right-[14%] size-24 rounded-full bg-[#b9c6a9]" />
            <div className="relative flex size-40 items-center justify-center rounded-[2rem] bg-[#30352f] text-[#FFFDF9] shadow-xl shadow-[#30352f]/15 xl:size-48">
              <GraduationCap aria-hidden="true" className="size-20 stroke-[1.3] xl:size-24" />
              <span className="absolute -right-5 -top-5 flex size-12 items-center justify-center rounded-full bg-[#FA8132] text-white">
                <Sparkles aria-hidden="true" className="size-5" />
              </span>
            </div>
            <div className="absolute right-[7%] top-[17%] flex size-12 items-center justify-center rounded-full border border-[#d9cfc1] bg-[#FFFDF9] text-[#30352f]">
              <ArrowUpRight aria-hidden="true" className="size-5" />
            </div>
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
            <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-2xl bg-[#FA8132] text-white shadow-sm shadow-[#FA8132]/25">
              <GraduationCap aria-hidden="true" className="size-6" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#292c28]">Login to your account</h1>
            <p className="mt-3 text-sm text-[#77736c]">Enter your kosen email below to login your account</p>
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

          <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void handleSignIn(); }}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#363832]">Email</label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@kmitl.ac.th"
                className="h-11 border-[#e6e0d7] bg-white px-3"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="password" className="text-sm font-medium text-[#363832]">Password</label>
                <a href="#forgot-password" className="text-xs font-medium text-[#a75a2a] transition-colors hover:text-[#FA8132]">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="h-11 border-[#e6e0d7] bg-white px-3"
              />
            </div>
            <Button
              type="submit"
              className="h-11 w-full bg-[#FA8132] text-sm font-semibold text-white hover:bg-[#e76e24]"
            >
              login with KMITL
            </Button>
          </form>

          <p className="mt-8 text-center text-xs leading-5 text-[#89857e]">
            By continuing, you agree to our{" "}
            <a href="/terms" className="underline underline-offset-4 transition-colors hover:text-[#a75a2a]">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" className="underline underline-offset-4 transition-colors hover:text-[#a75a2a]">Privacy Policy</a>.
          </p>
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