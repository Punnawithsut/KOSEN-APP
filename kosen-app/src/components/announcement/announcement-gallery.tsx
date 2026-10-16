"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react";

import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import type { ResolvedAnnouncementFile } from "@/lib/announcement/types";

/** The design's strip holds three tiles: two thumbs and an overflow counter. */
const VISIBLE_TILES = 3;

/** 1 = fit. Past about 4x a phone photo is just mush. */
const MIN_SCALE = 1;
const MAX_SCALE = 4;

/** One click of the +/- buttons, and one wheel notch. */
const BUTTON_STEP = 1.5;
const WHEEL_STEP = 1.15;

/** How far a finger must travel sideways before it counts as a page turn. */
const SWIPE_THRESHOLD = 60;

type View = { scale: number; x: number; y: number };

const FIT: View = { scale: 1, x: 0, y: 0 };

/**
 * Keeps a zoomed photo on screen.
 *
 * `x` and `y` are percentages of the image's own box, which is what CSS
 * `translate` percentages mean — so the furthest it may travel is half of the
 * extra size the scale added.
 */
function clampView(next: View): View {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next.scale));
  if (scale === 1) return FIT;

  const bound = ((scale - 1) * 100) / 2;
  return {
    scale,
    x: Math.min(bound, Math.max(-bound, next.x)),
    y: Math.min(bound, Math.max(-bound, next.y)),
  };
}

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
  const [view, setView] = useState<View>(FIT);
  const [isGesturing, setIsGesturing] = useState(false);
  /** Live horizontal offset in px while a swipe is in progress. */
  const [swipeX, setSwipeX] = useState(0);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Live pointer positions, keyed by pointerId, so a second finger can turn a
  // drag into a pinch without losing the first one's position.
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null);
  const lastDragRef = useRef<{ x: number; y: number } | null>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const total = images.length;

  // Only while the viewer is actually open. This component stays mounted for as
  // long as the detail page shows a thumbnail strip, so locking unconditionally
  // would freeze the detail page of every announcement that has images.
  useBodyScrollLock(openIndex !== null);

  /**
   * Every way of changing photo goes through here, so a new image always starts
   * fitted. Carrying a zoom across images is disorienting and the pan offsets
   * would be meaningless. Doing it here rather than in an effect on `openIndex`
   * keeps it out of the cascading-render pattern the lint rule rejects.
   */
  const goTo = useCallback((index: number | null) => {
    setView(FIT);
    setSwipeX(0);
    setOpenIndex(index);
  }, []);

  const step = useCallback(
    (delta: number) => {
      setView(FIT);
      setSwipeX(0);
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

  // Keep the current thumbnail in view when arrowing through a long set —
  // `block: "nearest"` stops it from also nudging the scroll position
  // vertically.
  useEffect(() => {
    if (openIndex === null) return;
    stripRef.current?.children[openIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [openIndex]);

  function zoomTo(nextScale: number) {
    setView((current) => clampView({ ...current, scale: nextScale }));
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (event.deltaY === 0) return;
    // No `preventDefault`: the overlay is fixed and the page behind is locked,
    // so there is nothing for the wheel to scroll anyway.
    const factor = event.deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP;
    setView((current) =>
      clampView({ ...current, scale: current.scale * factor }),
    );
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    // A press on one of the overlay's buttons must not start a pan.
    if ((event.target as HTMLElement).closest("button")) return;

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    setIsGesturing(true);

    if (pointersRef.current.size === 2) {
      const [first, second] = [...pointersRef.current.values()];
      pinchRef.current = {
        distance: Math.hypot(first.x - second.x, first.y - second.y),
        // Snapshot the scale: during the pinch, `view` is stale by design.
        scale: view.scale,
      };
      lastDragRef.current = null;
      swipeRef.current = null;
      setSwipeX(0);
    } else {
      lastDragRef.current = { x: event.clientX, y: event.clientY };
      // One finger on an un-zoomed photo is a page turn, not a pan. Zoomed in,
      // the drag means pan — there is somewhere to pan to.
      if (total > 1 && view.scale === MIN_SCALE) {
        swipeRef.current = { x: event.clientX, y: event.clientY };
      }
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const pointers = pointersRef.current;
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const pinch = pinchRef.current;
    if (pinch && pointers.size >= 2) {
      const [first, second] = [...pointers.values()];
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      const nextScale = pinch.scale * (distance / pinch.distance);
      setView((current) => clampView({ ...current, scale: nextScale }));
      return;
    }

    // Swiping: the photo tracks the finger, and the decision is made on release.
    // Only clearly-horizontal travel counts, so a diagonal flick doesn't turn
    // the page underneath the user.
    const swipe = swipeRef.current;
    if (swipe) {
      const dx = event.clientX - swipe.x;
      const dy = event.clientY - swipe.y;
      if (Math.abs(dx) > Math.abs(dy)) setSwipeX(dx);
      return;
    }

    const last = lastDragRef.current;
    const image = imageRef.current;
    if (!last || !image || view.scale === MIN_SCALE) return;
    if (!image.offsetWidth || !image.offsetHeight) return;

    lastDragRef.current = { x: event.clientX, y: event.clientY };
    // Pixels -> the percentages `translate` expects, measured against the
    // image's own box rather than the viewport.
    const dx = ((event.clientX - last.x) / image.offsetWidth) * 100;
    const dy = ((event.clientY - last.y) / image.offsetHeight) * 100;
    setView((current) =>
      clampView({ ...current, x: current.x + dx, y: current.y + dy }),
    );
  }

  function endPointer(event: ReactPointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;

    const swipe = swipeRef.current;
    if (swipe && pointersRef.current.size === 0) {
      const dx = event.clientX - swipe.x;
      const dy = event.clientY - swipe.y;
      const containerWidth = event.currentTarget.clientWidth;

      if (Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        // Drag left -> next, so the photo always moves the way the finger did.
        const delta = dx < 0 ? 1 : -1;

        // `step` zeroes the offset, so this must come after it. The incoming
        // photo is then parked a full width away — on the side the finger was
        // travelling towards — and released on the next frame. Mounting off to
        // the far side is what makes it arrive rather than appear.
        step(delta);
        setSwipeX(delta === 1 ? containerWidth : -containerWidth);
        requestAnimationFrame(() => setSwipeX(0));
      } else {
        // Fell short: clearing this also clears `isGesturing`, re-enabling the
        // transform transition, so the photo springs back to centre.
        setSwipeX(0);
      }

      swipeRef.current = null;
    }

    if (pointersRef.current.size === 0) {
      lastDragRef.current = null;
      setIsGesturing(false);
    }
  }

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
            onClick={() => goTo(index)}
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
            onClick={() => goTo(shown)}
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
          className="fixed inset-0 z-[60] flex flex-col bg-bg-primary"
        >
          <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-3">
            {/* Paging lives up here beside the count, not floating over the
                photo. Centred on the image the arrows covered the subject —
                and a screenshot is busiest exactly at its edges. */}
            <div className="flex items-center gap-0.5">
              {total > 1 ? (
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() => step(-1)}
                  className="flex size-10 items-center justify-center rounded-full text-black-1 transition-colors hover:bg-black-6"
                >
                  <ChevronLeftIcon className="size-5" />
                </button>
              ) : null}

              <p
                aria-live="polite"
                className="min-w-12 text-center text-sm font-medium text-black-3"
              >
                {openIndex + 1} / {total}
              </p>

              {total > 1 ? (
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() => step(1)}
                  className="flex size-10 items-center justify-center rounded-full text-black-1 transition-colors hover:bg-black-6"
                >
                  <ChevronRightIcon className="size-5" />
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-1">
              {/* Only once zoomed — a reset that does nothing is just noise.
                  First in the row on purpose: the group is anchored to the
                  right edge, so gaining a button on its left leaves − + ✕
                  exactly where they were. Appending it at the end would slide
                  the close button out from under the user's finger. */}
              {view.scale > MIN_SCALE ? (
                <button
                  type="button"
                  aria-label="Fit to screen"
                  onClick={() => setView(FIT)}
                  className="flex size-10 items-center justify-center rounded-full text-black-1 transition-colors hover:bg-black-6"
                >
                  <RotateCcwIcon className="size-5" />
                </button>
              ) : null}

              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => zoomTo(view.scale / BUTTON_STEP)}
                disabled={view.scale <= MIN_SCALE}
                className="flex size-10 items-center justify-center rounded-full text-black-1 transition-colors hover:bg-black-6 disabled:opacity-30"
              >
                <MinusIcon className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => zoomTo(view.scale * BUTTON_STEP)}
                disabled={view.scale >= MAX_SCALE}
                className="flex size-10 items-center justify-center rounded-full text-black-1 transition-colors hover:bg-black-6 disabled:opacity-30"
              >
                <PlusIcon className="size-5" />
              </button>

              <button
                type="button"
                aria-label="Close"
                onClick={() => goTo(null)}
                className="flex size-10 items-center justify-center rounded-full text-black-1 transition-colors hover:bg-black-6"
              >
                <XIcon className="size-6" />
              </button>
            </div>
          </div>

          {/* `min-h-0` is what lets this shrink: without it the image refuses to
              give the filmstrip any room and the strip gets pushed off screen.

              `touch-action: none` is required for the pinch — without it the
              browser claims the touch gesture for panning the page and the
              pointer events we need never arrive. */}
          <div
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            style={{ touchAction: "none" }}
            className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              // Keyed by photo: without this React reuses the single element,
              // and the browser animates ONE transform from the drag offset to
              // zero — which drags the incoming photo in from the wrong side.
              key={current.url}
              ref={imageRef}
              src={current.url}
              alt=""
              decoding="async"
              // Without this the browser starts its own image drag on
              // mousedown and the pan never sees the move events.
              draggable={false}
              style={{
                transform: `translate(calc(${view.x}% + ${swipeX}px), ${view.y}%) scale(${view.scale})`,
                transition: isGesturing ? "none" : "transform 150ms ease-out",
              }}
              className={`max-h-full max-w-full rounded-2xl object-contain ${
                view.scale > MIN_SCALE ? "cursor-grab" : ""
              }`}
            />
          </div>

          {/* The filmstrip. Every image is listed, not just the first few — once
              the viewer is open the count is a fact about the set, not a limit.

              `w-fit max-w-full` + `mx-auto` centres the strip while it fits and
              lets it scroll once it doesn't. Centring the *contents* instead
              (`justify-center` on a full-width scroller) is the usual attempt
              and it clips the first thumbnails off the left edge where they
              can't be scrolled back to. */}
          {total > 1 ? (
            <div
              ref={stripRef}
              className="mx-auto flex w-fit max-w-full shrink-0 gap-2 overflow-x-auto px-4 py-3"
              style={{
                paddingBottom:
                  "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
              }}
            >
              {images.map((image, index) => (
                <button
                  key={image.url}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Show image ${index + 1} of ${total}`}
                  aria-current={index === openIndex ? "true" : undefined}
                  className={`shrink-0 overflow-hidden rounded-lg ring-2 transition-colors ${
                    index === openIndex
                      ? "ring-orange-primary"
                      : "ring-transparent hover:ring-black-5"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt=""
                    loading="lazy"
                    className="size-16 object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
