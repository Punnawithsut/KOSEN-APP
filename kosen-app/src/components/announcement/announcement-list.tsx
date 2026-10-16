"use client";

import { ApiError } from "@/lib/api/fetcher";
import { Button } from "@/components/ui/button";
import type { Announcement } from "@/lib/announcement/types";

import { AnnouncementCard } from "./announcement-card";

type AnnouncementListProps = {
  items: Announcement[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
};

/**
 * Maps an SWR error to something a student can act on.
 *
 * `apiFetcher` throws `ApiError`, which carries the HTTP `status` but falls back
 * to a generic message (the API's own text lives under `{ ok: false, error }`,
 * which the fetcher does not read). So we branch on `status` here.
 */
function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Please sign in to view announcements.";
    if (error.status === 403) return "You do not have access to announcements.";
    if (error.status === 400) {
      return "That filter combination is not supported yet.";
    }
    return `Could not load announcements (error ${error.status}).`;
  }

  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong while loading announcements.";
}

/** Renders the four possible states: loading, error, empty, data. */
export function AnnouncementList({
  items,
  isLoading,
  error,
  onRetry,
}: AnnouncementListProps) {
  // 1. Loading — only reached when there is no data at all yet.
  if (isLoading) {
    return (
      <div aria-busy className="space-y-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl bg-white/70 ring-1 ring-black-5"
          />
        ))}
      </div>
    );
  }

  // 2. Error
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-2xl bg-noti-negative-subtle p-4 text-sm text-black-2"
      >
        <p>{describeError(error)}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={onRetry}
        >
          Try again
        </Button>
      </div>
    );
  }

  // 3. Empty
  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-6 text-center text-sm text-black-3 ring-1 ring-black-5">
        No announcements found.
      </p>
    );
  }

  // 4. Data
  return (
    <div className="space-y-3">
      {items.map((announcement) => (
        <AnnouncementCard key={announcement.id} announcement={announcement} />
      ))}
    </div>
  );
}
