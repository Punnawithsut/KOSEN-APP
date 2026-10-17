import Image from "next/image";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-primary">
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

      <main className="relative mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-8 text-center">
        <div className="mb-6 size-24 overflow-hidden rounded-[22px] shadow-lg">
          <Image
            src="/icons/icon-192.png"
            width={96}
            height={96}
            alt="KOSEN App"
            priority
          />
        </div>

        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-orange-subtle-2 text-orange-secondary">
          <WifiOff className="size-6" aria-hidden />
        </div>
        <h1
          className="text-3xl text-black-1"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          You&apos;re offline
        </h1>
        <p className="mt-1 text-sm font-medium tracking-widest text-orange-secondary uppercase">
          KMITL Campus App
        </p>
        <p className="mt-5 text-sm leading-6 text-black-3">
          Check your internet connection and try again. Pages you previously
          visited may still be available from the menu.
        </p>
        <p className="mt-6 text-xs text-black-4">
          KOSEN · KMITL Campus App
        </p>
      </main>
    </div>
  );
}