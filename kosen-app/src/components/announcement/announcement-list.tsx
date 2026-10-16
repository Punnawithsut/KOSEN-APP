"use client";

import { Button } from "@/components/ui/button";
import { describeAnnouncementError } from "@/lib/announcement/errors";
import type { Announcement } from "@/lib/announcement/types";

import { AnnouncementCard } from "./announcement-card";

type AnnouncementListProps = {
  items: Announcement[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  /** Admin-only. Leave both out for the plain student list. */
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (announcement: Announcement) => void;
};

/** Renders the four possible states: loading, error, empty, data. */
export function AnnouncementList({
  items,
  isLoading,
  error,
  onRetry,
  onEdit,
  onDelete,
}: AnnouncementListProps) {
  // 1. Loading — only reached when there is no data at all yet.
  if (isLoading) {
    return (
      <div aria-busy className="flex flex-col">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="flex animate-pulse items-center gap-[clamp(0.75rem,2vw,2.5rem)] border-b border-black-5 py-3 last:border-b-0"
          >
            <div className="flex-1 space-y-2 py-0.5">
              <div className="h-3.5 w-3/4 rounded bg-black-5" />
              <div className="h-3 w-full rounded bg-black-6" />
              <div className="h-3 w-2/3 rounded bg-black-6" />
              <div className="h-4 w-12 rounded-full bg-orange-subtle-2" />
            </div>
            <div className="aspect-[4/3] w-[45%] shrink-0 rounded-[clamp(0.75rem,1vw,1.5rem)] bg-blue-subtle-2 lg:aspect-[5/3] lg:w-[41%]" />
          </div>
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
        <p>{describeAnnouncementError(error)}</p>
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

  // 4. Data — one card per row, stacked down the page, as designed.
  return (
    <div className="flex flex-col">
      {items.map((announcement) => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
