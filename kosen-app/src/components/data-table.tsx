"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DataTablePagination,
  type PaginationState,
} from "@/components/data-table-pagination";

export type { PaginationState } from "@/components/data-table-pagination";

export interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  /** Stable key per row (e.g. row => row.id). Falls back to the index. */
  getRowKey?: (row: T, index: number) => React.Key;
}

/** Management-page table: bordered, header band, brand-tinted hover. */
export function DataTable<T>({
  columns,
  data,
  pagination,
  onPageChange,
  isLoading = false,
  emptyMessage = "No results found.",
  getRowKey,
}: DataTableProps<T>) {
  const skeletonRows = Math.max(pagination.pageSize, 1);

  return (
    <div className="w-full space-y-4">
      <div className="overflow-hidden rounded-lg border border-orange-subtle-2 bg-background">
        <Table aria-busy={isLoading}>
          <TableHeader className="bg-bg-primary">
            <TableRow className="border-orange-subtle-2 hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={String(col.key)}
                  className={cn("h-11 font-medium text-black-2", col.className)}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, rowIdx) => (
                <TableRow
                  key={`skeleton-${rowIdx}`}
                  className="border-orange-subtle-2/60 hover:bg-transparent"
                >
                  {columns.map((col) => (
                    <TableCell key={String(col.key)} className={col.className}>
                      <Skeleton className="h-4 w-full max-w-[220px] bg-orange-subtle-2/60" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-40 text-center text-black-3"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIdx) => (
                <TableRow
                  key={getRowKey ? getRowKey(row, rowIdx) : rowIdx}
                  className="border-orange-subtle-2/60 text-black-1 transition-colors hover:bg-bg-primary/70"
                >
                  {columns.map((col) => (
                    <TableCell key={String(col.key)} className={col.className}>
                      {col.cell
                        ? col.cell(row)
                        : String(
                            (row as Record<string, unknown>)[
                              col.key as string
                            ] ?? "",
                          )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        isLoading={isLoading}
      />
    </div>
  );
}
