"use client";

import * as React from "react";

import {
  DataTable,
  type DataTableColumn,
  type PaginationState,
} from "@/components/data-table";
import { LoanRequestManageDialogs } from "@/components/klongklongplus/loan-request-manage-dialogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useMyLoans } from "@/hooks/use-loan";
import { useSlots } from "@/hooks/use-slot";
import { useToast } from "@/hooks/use-toast";
import type {
  ApiResponse,
  ItemType,
  LoanFilters,
  LoanRecord,
  LoanStatus,
  PagedData,
} from "@/hooks/types/klongklongplus-types";
import { Pencil, Trash2 } from "lucide-react";

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

export default function MyRequestsView({
  initialLoans,
}: {
  initialLoans?: ApiResponse<PagedData<LoanRecord>>;
}) {
  const [page, setPage] = React.useState(1);
  const [filters, setFilters] = React.useState<LoanFilters>({});
  const [editingLoan, setEditingLoan] = React.useState<LoanRecord | null>(null);
  const [deletingLoan, setDeletingLoan] = React.useState<LoanRecord | null>(
    null,
  );
  const { toast } = useToast();
  const { data, error, isLoading } = useMyLoans(page, filters, initialLoans);
  const { data: slotsResponse, error: slotsError } = useSlots();
  const pageData = data?.data;
  const slots = slotsResponse?.data.items ?? [];

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
    {
      key: "manage",
      header: "Manage",
      cell: (loan) => {
        const isPending = loan.status === "pending";
        return (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={!isPending}
              aria-label={`Edit request for ${loan.unit.code}`}
              title={
                isPending
                  ? "Edit request"
                  : "Only pending requests can be edited"
              }
              onClick={() => {
                setEditingLoan(loan);
              }}
            >
              <Pencil />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={!isPending}
              aria-label={`Delete request for ${loan.unit.code}`}
              title={
                isPending
                  ? "Delete request"
                  : "Only pending requests can be deleted"
              }
              onClick={() => setDeletingLoan(loan)}
            >
              <Trash2 />
            </Button>
          </div>
        );
      },
      className: "w-24",
    },
  ];

  React.useEffect(() => {
    if (error) {
      toast({
        title: "Unable to load your requests",
        description: error.message,
        variant: "error",
      });
    }
  }, [error, toast]);

  React.useEffect(() => {
    if (slotsError) {
      toast({
        title: "Unable to load time slots",
        description: slotsError.message,
        variant: "error",
      });
    }
  }, [slotsError, toast]);

  function updateFilter<K extends keyof LoanFilters>(
    key: K,
    value: LoanFilters[K],
  ) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value || undefined }));
  }

  function clearFilters() {
    setFilters({});
    setPage(1);
  }

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

      <section
        aria-label="Filter requests"
        className="grid gap-3 rounded-lg border border-orange-subtle-2 bg-background p-4 sm:grid-cols-2 lg:grid-cols-6"
      >
        <label className="space-y-1.5 text-sm font-medium text-black-2">
          Unit name or code
          <Input
            className="h-8 text-sm"
            value={filters.unitSearch ?? ""}
            onChange={(event) => updateFilter("unitSearch", event.target.value)}
            placeholder="Search unit"
          />
        </label>

        <label className="space-y-1.5 text-sm font-medium text-black-2">
          Unit type
          <Select
            className="h-8 text-sm"
            value={filters.itemType ?? ""}
            onChange={(event) =>
              updateFilter(
                "itemType",
                (event.target.value || undefined) as ItemType | undefined,
              )
            }
          >
            <option value="">All types</option>
            <option value="calculator">Calculator</option>
            <option value="charger">Charger</option>
          </Select>
        </label>

        <label className="space-y-1.5 text-sm font-medium text-black-2">
          Borrow date
          <Input
            className="h-8 text-sm"
            type="date"
            value={filters.slotDate ?? ""}
            onChange={(event) => updateFilter("slotDate", event.target.value)}
          />
        </label>

        <label className="space-y-1.5 text-sm font-medium text-black-2">
          Time slot
          <Select
            className="h-8 text-sm"
            value={filters.slotId ?? ""}
            onChange={(event) =>
              updateFilter("slotId", event.target.value || undefined)
            }
          >
            <option value="">All time slots</option>
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.startTime.slice(0, 5)}–{slot.endTime.slice(0, 5)}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-1.5 text-sm font-medium text-black-2">
          Status
          <Select
            className="h-8 text-sm"
            value={filters.status ?? ""}
            onChange={(event) =>
              updateFilter(
                "status",
                (event.target.value || undefined) as LoanStatus | undefined,
              )
            }
          >
            <option value="">All statuses</option>
            {Object.keys(STATUS_STYLES).map((status) => (
              <option key={status} value={status}>
                {formatStatus(status as LoanStatus)}
              </option>
            ))}
          </Select>
        </label>

        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={Object.values(filters).every((value) => !value)}
          >
            Clear filters
          </Button>
        </div>
      </section>

      <DataTable
        columns={columns}
        data={pageData?.items ?? []}
        getRowKey={(loan) => loan.id}
        pagination={pagination}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage={
          Object.values(filters).some(Boolean)
            ? "No requests match these filters."
            : "You have not made any equipment requests yet."
        }
      />

      <LoanRequestManageDialogs
        editingLoan={editingLoan}
        deletingLoan={deletingLoan}
        onCloseEdit={() => setEditingLoan(null)}
        onCloseDelete={() => setDeletingLoan(null)}
      />
    </main>
  );
}
