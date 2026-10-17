"use client";

import { useEffect } from "react";

/**
 * Holds the page behind a full-screen overlay still.
 *
 * Radix's `Dialog` does this for us wherever we use one, but the preview and the
 * gallery viewer are plain `div`s. Without this the page behind stays scrollable
 * and its scrollbar comes back the moment the overlay opens.
 *
 * `locked` exists because a component can be mounted while its overlay is shut.
 * The gallery, for instance, renders a thumbnail strip on the detail page and
 * only becomes full-screen once you click a tile — locking on mount there would
 * freeze the detail page for as long as an announcement had any images at all.
 *
 * Safe to have two overlays locked at once: each saves the value it found and
 * restores it on release, so unwinding is last-in-first-out.
 */
export function useBodyScrollLock(locked = true) {
  useEffect(() => {
    if (!locked) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [locked]);
}
