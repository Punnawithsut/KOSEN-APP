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
    <section className="relative isolate aspect-[390/330] w-full overflow-hidden bg-bg-primary text-center md:aspect-auto md:h-[calc(100vh-4rem)] md:min-h-[28rem]">
      {/*
        Two artworks, because the phone and desktop designs want different
        proportions. `slice` keeps the circles circular at any size.

        Desktop height is `100vh - 4rem`: the Navbar is `fixed h-16` and renders
        its own 64px spacer, so nav + hero = exactly one screen at 1080p.
      */}

      {/* Phone artwork */}
      <svg
        aria-hidden
        viewBox="0 0 390 330"
        preserveAspectRatio="xMidYMin slice"
        className="pointer-events-none absolute inset-0 size-full md:hidden"
      >
        <circle cx="195" cy="0" r="300" className="fill-orange-subtle-2" />
        <circle cx="195" cy="0" r="272" className="fill-orange-subtle-1" />
        <circle cx="195" cy="0" r="242" className="fill-orange-primary" />
      </svg>

      {/* Desktop artwork — a shallower dome, leaving cream for the chevron. */}
      <svg
        aria-hidden
        viewBox="0 0 1920 1016"
        preserveAspectRatio="xMidYMin slice"
        className="pointer-events-none absolute inset-0 hidden size-full md:block"
      >
        <circle cx="960" cy="0" r="800" className="fill-orange-subtle-2" />
        <circle cx="960" cy="0" r="680" className="fill-orange-subtle-1" />
        <circle cx="960" cy="0" r="560" className="fill-orange-primary" />
      </svg>

      <div className="absolute inset-x-0 top-[15%] px-6 md:top-[22%]">
        <h1 className="font-display text-5xl leading-none tracking-tight text-white md:text-6xl lg:text-7xl">
          What&apos;s new?
        </h1>

        <p className="mx-auto mt-5 max-w-[17rem] text-sm leading-relaxed text-white/85 md:max-w-[24rem] md:text-base lg:text-lg">
          Stay updated with the latest school news, student activities, upcoming
          events, and important announcements.
        </p>
      </div>

      {/* Double chevron, sitting on the cream area below the dome. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-[78%] flex flex-col items-center text-orange-subtle-1 md:top-[90%]"
      >
        <ChevronDownIcon className="size-5 md:size-7" />
        <ChevronDownIcon className="-mt-3 size-5 md:-mt-4 md:size-7" />
      </div>
    </section>
  );
}
