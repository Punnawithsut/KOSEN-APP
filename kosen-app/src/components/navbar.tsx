"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Megaphone, Building2, Package, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/announcement", label: "Announcements", icon: Megaphone },
  { href: "/dormitory", label: "Dormitory", icon: Building2 },
  { href: "/klongklongplus", label: "Klong Klong +", icon: Package },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop: fixed top bar ── */}
      <header className="fixed inset-x-0 top-0 z-50 hidden h-16 items-center justify-between border-b border-orange-subtle-2 bg-bg-primary px-8 md:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/icons/icon-192.png"
            width={32}
            height={32}
            alt="KOSEN"
            className="rounded-lg"
          />
          <span className="text-sm font-semibold tracking-wide text-black-1">
            KOSEN
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-orange-subtle-2 text-orange-secondary"
                    : "text-black-3 hover:bg-orange-subtle-2/60 hover:text-black-1"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>
      {/* ── Mobile: fixed bottom tab bar ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-stretch border-t border-orange-subtle-2 bg-bg-primary md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? "text-orange-secondary" : "text-black-4"
              }`}
            >
              <Icon
                className={`size-5 shrink-0 transition-transform ${active ? "scale-110" : ""}`}
              />
              <span className="text-[10px] font-medium leading-none">
                {label === "Announcements" ? "News" : label}
              </span>
            </Link>
          );
        })}
      </nav>
      {/* spacers so page content isn't hidden behind the fixed bars */}
      <div className="hidden h-16 md:block" aria-hidden /> {/* desktop top */}
    </>
  );
}
