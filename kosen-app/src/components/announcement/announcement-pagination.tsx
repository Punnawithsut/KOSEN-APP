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
 * `‹ 1 of 12 ›` page control.
 *
 * Deliberately hidden when there is only one page — a control that cannot do
 * anything is just noise.
 */
export function AnnouncementPagination({
  page,
  totalPages,
  disabled = false,
  onChange,
}: AnnouncementPaginationProps) {
  if (totalPages <= 1) return null;

  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <nav
      aria-label="Announcement pages"
      className="mt-4 flex items-center justify-center gap-4 rounded-full bg-blue-subtle-2 py-1.5"
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
        className="min-w-16 text-center text-sm font-medium text-blue-secondary"
      >
        {page} of {totalPages}
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
