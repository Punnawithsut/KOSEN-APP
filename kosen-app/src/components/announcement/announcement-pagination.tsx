"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type AnnouncementPaginationProps = {
  page: number;
  totalPages: number;
  /** Disable both arrows while a request is in flight. */
  disabled?: boolean;
  onChange: (page: number) => void;
};

/**
 * `‹ 1 of 2 ›` page control.
 *
 * Always rendered — even with a single page — so the control stays visible in
 * the layout. Both arrows simply disable when there is nowhere to go.
 */
export function AnnouncementPagination({
  page,
  totalPages,
  disabled = false,
  onChange,
}: AnnouncementPaginationProps) {
  // The API reports `totalPages: 0` when there are no rows, which would render
  // as the nonsense "1 of 0". Clamp to a minimum of one page.
  const pages = Math.max(1, totalPages);

  const isFirstPage = page <= 1;
  const isLastPage = page >= pages;

  return (
    <nav
      aria-label="Announcement pages"
      className="mt-4 flex items-center justify-center gap-3 py-1.5"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Previous page"
        disabled={disabled || isFirstPage}
        onClick={() => onChange(page - 1)}
        className="text-black-1"
      >
        <ChevronLeftIcon />
      </Button>

      <span
        aria-live="polite"
        // `min-w` stops the chevrons jumping sideways as 1 -> 10 changes width.
        className="min-w-16 text-center text-sm font-medium text-black-1"
      >
        {page} of {pages}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Next page"
        disabled={disabled || isLastPage}
        onClick={() => onChange(page + 1)}
        className="text-black-1"
      >
        <ChevronRightIcon />
      </Button>
    </nav>
  );
}
