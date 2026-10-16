"use client";

import * as React from "react";

import {
  DataTable,
  type DataTableColumn,
  type PaginationState,
} from "@/components/data-table";
import { useMyLoans } from "@/hooks/use-loan";
import type {
  LoanRecord,
  LoanStatus,
} from "@/hooks/types/klongklongplus-types";

const STATUS_STYLES: Record<LoanStatus, string> = {
  pending: "bg-noti-warning-subtle text-black-2",
  approved: "bg-noti-positive-subtle text-black-2",
  delivered: "bg-orange-subtle-2 text-black-2",
  returned: "bg-noti-positive-subtle text-black-2",
  overdue: "bg-negative-subtle text-negative-primary",
  cancelled: "bg-muted text-muted-foreground",
  rejected: "bg-muted text-muted-foreground",
  expired: "bg-muted text-muted-foreground",
  no_show: "bg-muted text-muted-foreground",
};

function formatSlotDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatRequestedAt(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function formatStatus(status: LoanStatus) {
  if (status === "no_show") return "No show";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

const columns: DataTableColumn<LoanRecord>[] = [
  {
    key: "unit",
    header: "Unit",
    cell: (loan) => loan.unit.code,
    className: "font-medium",
  },
  {
    key: "itemType",
    header: "Type",
    cell: (loan) =>
      loan.itemType.charAt(0).toUpperCase() + loan.itemType.slice(1),
  },
  {
    key: "slotDate",
    header: "Borrow date",
    cell: (loan) => formatSlotDate(loan.slotDate),
  },
  {
    key: "slot",
    header: "Time slot",
    cell: (loan) =>
      `${loan.slot.startTime.slice(0, 5)}–${loan.slot.endTime.slice(0, 5)}`,
  },
  {
    key: "term",
    header: "Term",
    cell: (loan) => loan.term.name,
  },
  {
    key: "status",
    header: "Status",
    cell: (loan) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[loan.status]}`}
      >
        {formatStatus(loan.status)}
      </span>
    ),
  },
  {
    key: "requestedAt",
    header: "Requested",
    cell: (loan) => formatRequestedAt(loan.requestedAt),
    className: "tabular-nums text-muted-foreground",
  },
];

export default function MyRequestsPage() {
  const [page, setPage] = React.useState(1);
  const { data, error, isLoading } = useMyLoans(page);
  const pageData = data?.data;

  const pagination: PaginationState = {
    page: pageData?.page ?? page,
    pageSize: pageData?.pageSize ?? 20,
    total: pageData?.total ?? 0,
    totalPages: Math.ceil((pageData?.total ?? 0) / (pageData?.pageSize ?? 20)),
  };

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-black-1">
          My Requests
        </h1>
        <p className="text-sm text-black-3">
          Track the status and schedule of your equipment requests.
        </p>
      </header>

      {error && (
        <p role="alert" className="text-sm text-negative-primary">
          Unable to load your requests: {error.message}
        </p>
      )}

      <DataTable
        columns={columns}
        data={pageData?.items ?? []}
        getRowKey={(loan) => loan.id}
        pagination={pagination}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="You have not made any equipment requests yet."
      />
    </main>
  );
}
