"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DataTablePagination,
  type PaginationState,
} from "@/components/data-table-pagination";

export type { PaginationState } from "@/components/data-table-pagination";

/** What one row shows. Map your own data to this with `getItem`. */
export interface DataTableUserItem {
  id: string | number;
  title: string;
  description?: string;
  status?: {
    label: string;
    className: string;
  };
  /** Small muted line, e.g. "post on 14/10/26" */
  meta?: string;
  /** Button label. Defaults to "more". */
  actionLabel?: string;
  /** Renders the action as a link. */
  href?: string;
  /** Renders the action as a button (ignored if href is set). */
  onAction?: () => void;
  /** Disables the row action button. */
  actionDisabled?: boolean;
  /** Optional leading slot (icon, thumbnail...). */
  leading?: React.ReactNode;
}

export interface DataTableUserProps<T> {
  data: T[];
  getItem: (row: T) => DataTableUserItem;
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

const actionClass =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-orange-primary px-5 text-sm font-medium text-white transition-colors hover:bg-orange-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-subtle-1 focus-visible:ring-offset-2";

/** User-facing list: borderless, pastel rows, one action per row. */
export function DataTableUser<T>({
  data,
  getItem,
  pagination,
  onPageChange,
  isLoading = false,
  emptyMessage = "Nothing here yet.",
}: DataTableUserProps<T>) {
  const skeletonRows = Math.max(pagination.pageSize, 1);

  return (
    <div className="w-full space-y-5">
      <ul className="space-y-3" aria-busy={isLoading}>
        {isLoading ? (
          Array.from({ length: skeletonRows }).map((_, i) => (
            <li
              key={`skeleton-${i}`}
              className="flex flex-col gap-3 rounded-xl bg-bg-primary px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="w-full max-w-md space-y-2.5">
                <Skeleton className="h-5 w-2/3 bg-orange-subtle-2/70" />
                <Skeleton className="h-4 w-full bg-orange-subtle-2/50" />
                <Skeleton className="h-3 w-24 bg-orange-subtle-2/40" />
              </div>
              <Skeleton className="h-8 w-20 rounded-full bg-orange-subtle-2/70" />
            </li>
          ))
        ) : data.length === 0 ? (
          <li className="rounded-xl bg-bg-primary px-5 py-16 text-center text-black-3">
            {emptyMessage}
          </li>
        ) : (
          data.map((row) => {
            const item = getItem(row);
            const label = item.actionLabel ?? "more";

            return (
              <li
                key={item.id}
                className={cn(
                  "flex flex-col gap-4 rounded-xl bg-bg-primary px-5 py-5 transition-colors",
                  "hover:bg-orange-subtle-2/40 sm:flex-row sm:items-center sm:justify-between sm:gap-6",
                )}
              >
                <div className="flex min-w-0 items-start gap-4">
                  {item.leading}
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-medium leading-snug text-black-1 sm:text-lg">
                        {item.title}
                      </h3>
                      {item.status && (
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                            item.status.className,
                          )}
                        >
                          {item.status.label}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="line-clamp-2 text-sm text-black-3">
                        {item.description}
                      </p>
                    )}
                    {item.meta && (
                      <p className="pt-1 text-xs text-black-4">{item.meta}</p>
                    )}
                  </div>
                </div>

                {item.href ? (
                  <Link href={item.href} className={actionClass}>
                    {label}
                  </Link>
                ) : item.onAction ? (
                  <button
                    type="button"
                    onClick={item.onAction}
                    className={actionClass}
                    disabled={item.actionDisabled}
                  >
                    {label}
                  </button>
                ) : null}
              </li>
            );
          })
        )}
      </ul>

      <DataTablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        isLoading={isLoading}
      />
    </div>
  );
}
