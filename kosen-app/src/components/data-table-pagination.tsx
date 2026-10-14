"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* -------------------------------------------------------------------------- */
/*  Shared types                                                               */
/* -------------------------------------------------------------------------- */

export interface PaginationState {
  /** 1-based page index */
  page: number;
  /** Fixed by the backend. Used for display / skeleton rows only; never sent. */
  pageSize: number;
  total: number;
  /** If 0 / missing, falls back to Math.ceil(total / pageSize) */
  totalPages: number;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function resolveTotalPages({
  total,
  pageSize,
  totalPages,
}: PaginationState) {
  if (totalPages && totalPages > 0) return totalPages;
  if (total > 0 && pageSize > 0) return Math.ceil(total / pageSize);
  return 1;
}

type PageItem = number | "ellipsis-start" | "ellipsis-end";

/** Smart truncation: 1 … 4 5 6 … 10 */
export function getPageItems(
  current: number,
  totalPages: number,
  siblings = 1,
): PageItem[] {
  const maxWithoutTruncation = siblings * 2 + 5;
  if (totalPages <= maxWithoutTruncation) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const left = Math.max(current - siblings, 2);
  const right = Math.min(current + siblings, totalPages - 1);
  const showStartEllipsis = left > 2;
  const showEndEllipsis = right < totalPages - 1;

  const items: PageItem[] = [1];
  if (showStartEllipsis) items.push("ellipsis-start");
  else for (let p = 2; p < left; p++) items.push(p);

  for (let p = left; p <= right; p++) items.push(p);

  if (showEndEllipsis) items.push("ellipsis-end");
  else for (let p = right + 1; p < totalPages; p++) items.push(p);

  items.push(totalPages);
  return items;
}

/* -------------------------------------------------------------------------- */
/*  Brand styles (from globals.css tokens)                                     */
/* -------------------------------------------------------------------------- */

const navButton =
  "size-8 border-orange-subtle-2 bg-transparent text-black-2 hover:bg-orange-subtle-2/50 hover:text-black-1 disabled:opacity-40";
const pageButtonIdle =
  "size-8 text-sm tabular-nums text-black-2 hover:bg-orange-subtle-2/50 hover:text-black-1";
const pageButtonActive =
  "size-8 text-sm tabular-nums bg-orange-primary text-white hover:bg-orange-secondary hover:text-white";

/* -------------------------------------------------------------------------- */
/*  Pagination bar                                                             */
/* -------------------------------------------------------------------------- */

export function DataTablePagination({
  pagination,
  onPageChange,
  isLoading = false,
}: {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}) {
  const totalPages = resolveTotalPages(pagination);
  const page = clamp(pagination.page, 1, totalPages);

  const goTo = React.useCallback(
    (target: number) => {
      const next = clamp(target, 1, totalPages);
      if (next !== page) onPageChange(next);
    },
    [onPageChange, page, totalPages],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-black-3" aria-live="polite">
        Showing Page {page} of {totalPages}{" "}
        <span className="text-black-4">
          (Total {pagination.total.toLocaleString()} items)
        </span>
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className={navButton}
            onClick={() => goTo(page - 1)}
            disabled={isLoading || page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>

          {getPageItems(page, totalPages).map((item) =>
            typeof item === "string" ? (
              <span
                key={item}
                aria-hidden
                className="flex size-8 items-center justify-center text-sm text-black-4"
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                variant="ghost"
                size="icon"
                className={item === page ? pageButtonActive : pageButtonIdle}
                onClick={() => goTo(item)}
                disabled={isLoading}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
              >
                {item}
              </Button>
            ),
          )}

          <Button
            variant="outline"
            size="icon"
            className={navButton}
            onClick={() => goTo(page + 1)}
            disabled={isLoading || page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </nav>

        <JumpToPage
          page={page}
          totalPages={totalPages}
          disabled={isLoading}
          onCommit={goTo}
        />
      </div>
    </div>
  );
}

function JumpToPage({
  page,
  totalPages,
  disabled,
  onCommit,
}: {
  page: number;
  totalPages: number;
  disabled: boolean;
  onCommit: (page: number) => void;
}) {
  const [value, setValue] = React.useState(String(page));

  React.useEffect(() => {
    setValue(String(page));
  }, [page]);

  const commit = () => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      setValue(String(page));
      return;
    }
    const target = clamp(parsed, 1, totalPages); // overflow guard
    setValue(String(target));
    onCommit(target);
  };

  return (
    <label className="flex items-center gap-2 text-sm text-black-3">
      Go to page
      <Input
        type="text"
        inputMode="numeric"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur(); // blur triggers a single commit
        }}
        className={cn(
          "h-8 w-16 border-orange-subtle-2 text-center tabular-nums",
          "focus-visible:border-orange-primary focus-visible:ring-orange-subtle-1",
        )}
        aria-label={`Go to page (1 to ${totalPages})`}
      />
    </label>
  );
}
