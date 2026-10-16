import { ChevronDownIcon } from "lucide-react";

/**
 * Announcement hero — the design's "sunrise".
 *
 * Not a gradient band: three concentric circles are centred on the TOP edge of
 * the section, so only their lower halves are visible, stacking into an orange
 * dome with two lighter arcs around it. Everything sits on the cream page.
 *
 * Server-safe on purpose — no state and no browser APIs, so this needs no
 * `"use client"` and ships zero JavaScript.
 */
export function AnnouncementHero() {
  return (
    <section className="relative isolate overflow-hidden bg-bg-primary text-center">
      <svg
        aria-hidden
        viewBox="0 0 390 330"
        preserveAspectRatio="xMidYMax slice"
        className="pointer-events-none absolute inset-x-0 top-0 h-[330px] w-full"
      >
        {/* Outer arc -> mid arc -> solid dome. */}
        <circle cx="195" cy="0" r="300" className="fill-orange-subtle-2" />
        <circle cx="195" cy="0" r="272" className="fill-orange-subtle-1" />
        <circle cx="195" cy="0" r="242" className="fill-orange-primary" />
      </svg>

      <div className="relative px-6 pt-14">
        <h1 className="font-display text-5xl leading-none tracking-tight text-white">
          What&apos;s new?
        </h1>

        <p className="mx-auto mt-5 max-w-[17rem] text-sm leading-relaxed text-white/85">
          Stay updated with the latest school news, student activities, upcoming
          events, and important announcements.
        </p>
      </div>

      {/* Double chevron, sitting on the cream area below the dome. */}
      <div
        aria-hidden
        className="relative mt-28 flex flex-col items-center pb-4 text-orange-subtle-1"
      >
        <ChevronDownIcon className="size-5" />
        <ChevronDownIcon className="-mt-3 size-5" />
      </div>
    </section>
  );
}
