import { ChevronDownIcon } from "lucide-react";

/**
 * Orange gradient hero at the top of the announcement screen.
 *
 * The bottom edge is drawn as two stacked SVG bands (light orange, then the
 * cream page colour) so the gradient blends into the page with the design's
 * layered organic curve.
 *
 * Server-safe on purpose — no state and no browser APIs, so this needs no
 * `"use client"` and ships zero JavaScript.
 */
export function AnnouncementHero() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-orange-primary via-orange-primary to-orange-subtle-1 px-6 pt-10 pb-16 text-center text-white">
      <h1 className="relative font-display text-4xl leading-tight tracking-tight">
        What&apos;s new?
      </h1>

      <p className="relative mx-auto mt-3 max-w-[17rem] text-sm leading-relaxed text-white/85">
        Stay updated with the latest school news, student activities, upcoming
        events, and important announcements.
      </p>

      {/* Double chevron scroll affordance. */}
      <div
        aria-hidden
        className="relative mt-5 flex flex-col items-center text-white/70"
      >
        <ChevronDownIcon className="size-5" />
        <ChevronDownIcon className="-mt-3 size-5" />
      </div>

      {/* Layered bottom waves: light-orange band behind, cream band in front. */}
      <svg
        aria-hidden
        viewBox="0 0 390 64"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-14 w-full"
      >
        <path
          className="fill-orange-subtle-2"
          d="M0 20c58 20 118-10 180 2s122 22 210 2v40H0z"
        />
        <path
          className="fill-bg-primary"
          d="M0 36c66 18 128-8 196 4s124 18 194 4v20H0z"
        />
      </svg>
    </section>
  );
}
