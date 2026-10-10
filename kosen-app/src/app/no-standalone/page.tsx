"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Download, Share, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useIsStandalone } from "@/lib/use-standalone";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function useInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    setIsIos(/iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua));

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setPrompt(null);
  }

  return { prompt, isIos, installed, install };
}

export default function NoStandalonePage() {
  const router = useRouter();
  const { prompt, isIos, installed, install } = useInstallPrompt();

  const standalone = useIsStandalone();

  if (standalone) {
    router.push("/announcement");
  }

  if (installed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-positive-subtle">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="size-8 text-positive-primary"
          >
            <path
              d="M20 6 9 17l-5-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="mt-5 text-xl font-semibold text-black-1">
          App installed!
        </h1>
        <p className="mt-2 text-sm text-black-3">
          Open KOSEN from your home screen to continue.
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-primary">
      {/* decorative circles */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-16 size-64 rounded-full"
        style={{
          background:
            "linear-gradient(135deg, var(--color-orange-subtle-1), var(--color-orange-secondary))",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -right-20 size-72 rounded-full"
        style={{
          background:
            "linear-gradient(135deg, var(--color-blue-subtle-1), var(--color-blue-secondary))",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 right-32 size-40 rounded-full bg-blue-primary opacity-60"
      />

      <div className="relative mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-8 text-center">
        {/* app icon */}
        <div className="mb-6 size-24 overflow-hidden rounded-[22px] shadow-lg">
          <Image
            src="/icons/icon-192.png"
            width={96}
            height={96}
            alt="KOSEN App"
            priority
          />
        </div>

        <h1
          className="text-3xl text-black-1"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          KOSEN
        </h1>
        <p className="mt-1 text-sm font-medium tracking-widest text-orange-secondary uppercase">
          KMITL Campus App
        </p>

        <p className="mt-5 text-sm leading-6 text-black-3">
          Install KOSEN on your device for the full experience — announcements,
          dormitory info, and the Klong+ lending box, all in one place.
        </p>

        {/* Android / Desktop: one-click install button */}
        {prompt && (
          <Button
            onClick={install}
            className="mt-8 h-12 w-full bg-orange-secondary text-white hover:brightness-90"
          >
            <Download className="size-4" />
            Install app
          </Button>
        )}

        {/* iOS: step-by-step instructions (no API available) */}
        {isIos && !prompt && (
          <div className="mt-8 w-full rounded-2xl border border-orange-subtle-2 bg-white/80 p-5 text-left backdrop-blur-sm">
            <p className="mb-4 text-sm font-semibold text-black-1">
              Add to Home Screen
            </p>
            <ol className="space-y-3">
              <Step
                n={1}
                icon={<Share className="size-4 shrink-0 text-blue-primary" />}
              >
                Tap the <span className="font-medium text-black-1">Share</span>{" "}
                button at the bottom of Safari
              </Step>
              <Step
                n={2}
                icon={<Plus className="size-4 shrink-0 text-blue-primary" />}
              >
                Scroll down and tap{" "}
                <span className="font-medium text-black-1">
                  Add to Home Screen
                </span>
              </Step>
              <Step
                n={3}
                icon={
                  <div className="flex size-4 shrink-0 items-center justify-center rounded bg-orange-secondary text-[9px] font-bold text-white">
                    A
                  </div>
                }
              >
                Tap <span className="font-medium text-black-1">Add</span> —
                that&apos;s it
              </Step>
            </ol>
          </div>
        )}

        {/* Fallback: browser doesn't support install prompt and isn't iOS */}
        {!prompt && !isIos && (
          <div className="mt-8 w-full rounded-2xl border border-orange-subtle-2 bg-white/80 p-5 text-left backdrop-blur-sm">
            <p className="text-sm font-semibold text-black-1">
              Install manually
            </p>
            <p className="mt-2 text-xs leading-5 text-black-3">
              Open this page in{" "}
              <span className="font-medium text-black-1">Chrome</span> or{" "}
              <span className="font-medium text-black-1">Edge</span>, then look
              for the install icon{" "}
              <span className="font-medium text-black-1">(⊕)</span> in the
              address bar.
            </p>
          </div>
        )}

        <p className="mt-6 text-xs text-black-4">
          Works on Android, iOS, and Windows — no app store needed.
        </p>
      </div>
    </div>
  );
}

function Step({
  n,
  icon,
  children,
}: {
  n: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-orange-subtle-2 text-xs font-semibold text-orange-secondary">
        {n}
      </div>
      <div className="flex items-center gap-2 pt-0.5 text-sm text-black-3">
        {icon}
        <span>{children}</span>
      </div>
    </li>
  );
}
