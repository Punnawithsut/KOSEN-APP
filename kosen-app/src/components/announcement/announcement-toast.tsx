"use client";

import Link from "next/link";
import { useEffect } from "react";

type AnnouncementToastProps = {
  message: string;
  onDismiss: () => void;
  /** Optional call-to-action, e.g. link to /profile. */
  actionHref?: string;
  actionLabel?: string;
  /** How long the toast stays on screen. */
  durationMs?: number;
};

/**
 * A small inline notice that appears directly below the filter bar.
 *
 * This is intentionally NOT a global toast library: the message belongs to the
 * filter area, so keeping it in the layout is simpler and needs no dependency.
 *
 * `onDismiss` must be stable (wrap it in `useCallback` in the parent) —
 * otherwise this effect would restart on every render and never fire.
 */
export function AnnouncementToast({
  message,
  onDismiss,
  actionHref,
  actionLabel = "Configure",
  durationMs = 3500,
}: AnnouncementToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  return (
    <div
      role="status"
      className="mt-3 flex items-start gap-2 rounded-xl bg-noti-warning-subtle px-3 py-2 text-xs text-black-2 ring-1 ring-warning-primary"
    >
      <span
        aria-hidden
        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning-primary"
      />
      <p className="flex-1 leading-relaxed">{message}</p>
      {actionHref ? (
        <Link
          href={actionHref}
          className="shrink-0 font-medium text-blue-secondary underline underline-offset-2"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
