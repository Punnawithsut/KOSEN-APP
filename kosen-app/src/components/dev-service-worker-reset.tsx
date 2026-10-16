"use client";

import { useEffect } from "react";

/**
 * Development-only escape hatch for the Serwist service worker.
 *
 * `next.config.ts` already disables Serwist outside production, but that only
 * stops it *registering* a worker — it does nothing about one that is already
 * installed in the browser from an earlier `npm run build` / `npm start`, or
 * from toggling push notifications on. Such a worker keeps a precache of the
 * chunks it saw during that production build and serves them ahead of the
 * network, so:
 *
 *   - Turbopack ships fresh HTML, the worker hands the client old components,
 *     and React reports "Hydration failed because the server rendered HTML
 *     didn't match the client"
 *   - worse, the page quietly keeps rendering pre-change markup, so UI edits
 *     look like they did nothing
 *
 * So on every dev load: if anything is registered or cached, drop it and reload
 * once. The reload is the point — it is what makes the tab run purely off the
 * dev server. It only fires when there was actually something to clear, so it
 * can't loop, and in production the whole effect returns immediately.
 */
export function DevServiceWorkerReset() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;

    async function clearStaleWorker() {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const cacheNames = await caches.keys();
      if (cancelled) return;

      const nothingToDo = registrations.length === 0 && cacheNames.length === 0;
      if (nothingToDo) return;

      await Promise.all(registrations.map((entry) => entry.unregister()));
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      if (cancelled) return;

      window.location.reload();
    }

    void clearStaleWorker();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
