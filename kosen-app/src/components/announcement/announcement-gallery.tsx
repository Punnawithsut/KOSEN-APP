"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";

import type { ResolvedAnnouncementFile } from "@/lib/announcement/types";

/** The design's strip holds three tiles: two thumbs and an overflow counter. */
const VISIBLE_TILES = 3;

type AnnouncementGalleryProps = {
  images: ResolvedAnnouncementFile[];
};

/**
 * Thumbnail strip plus the full-screen viewer.
 *
 * The strip renders at most `VISIBLE_TILES` slots. When there are more images
 * than that, the last slot becomes a `+N` tile, matching the design — but every
 * tile opens the viewer, because the count is a hint, not a limit.
 */
export function AnnouncementGallery({ images }: AnnouncementGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const total = images.length;

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) => {
        if (current === null || total === 0) return current;
        // Wrap around, so a long gallery never dead-ends.
        return (current + delta + total) % total;
      });
    },
    [total],
  );

  useEffect(() => {
    if (openIndex === null) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenIndex(null);
      else if (event.key === "ArrowLeft") step(-1);
      else if (event.key === "ArrowRight") step(1);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openIndex, step]);

  if (total === 0) return null;

  const shown = total > VISIBLE_TILES ? VISIBLE_TILES - 1 : total;
  const overflow = total - shown;
  const current = openIndex === null ? null : images[openIndex];

  return (
    <>
      <div className="flex gap-3 rounded-2xl bg-blue-subtle-3 p-3">
        {images.slice(0, shown).map((image, index) => (
          <button
            key={image.url}
            type="button"
            onClick={() => setOpenIndex(index)}
            aria-label={`Open image ${index + 1} of ${total}`}
            className="min-w-0 flex-1 overflow-hidden rounded-xl transition-opacity hover:opacity-90"
          >
            {/* Plain <img>: these are short-lived signed Supabase URLs, so
                next/image optimisation is not a good fit. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt=""
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
          </button>
        ))}

        {overflow > 0 ? (
          <button
            type="button"
            onClick={() => setOpenIndex(shown)}
            aria-label={`Open the remaining ${overflow} images`}
            className="flex min-w-0 flex-1 items-center justify-center rounded-xl bg-blue-subtle-2 text-sm font-semibold text-blue-secondary transition-colors hover:bg-blue-subtle-1"
          >
            +{overflow}
          </button>
        ) : null}
      </div>

      {current && openIndex !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Image ${openIndex + 1} of ${total}`}
          // z-60 clears the navbar and the bottom tab bar (both z-50) and the
          // sticky filter bar (z-40).
          className="fixed inset-0 z-[60] flex items-center justify-center bg-bg-primary"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpenIndex(null)}
            className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full text-black-1 transition-colors hover:bg-black-6"
          >
            <XIcon className="size-6" />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.url}
            alt=""
            className="max-h-[80vh] max-w-[86vw] rounded-2xl object-contain"
          />

          {total > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={() => step(-1)}
                className="absolute top-1/2 left-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-orange-primary text-white transition-colors hover:bg-orange-secondary"
              >
                <ChevronLeftIcon className="size-6" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={() => step(1)}
                className="absolute top-1/2 right-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-orange-primary text-white transition-colors hover:bg-orange-secondary"
              >
                <ChevronRightIcon className="size-6" />
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
