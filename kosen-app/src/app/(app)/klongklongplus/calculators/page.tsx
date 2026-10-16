"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  DataTableUser,
  type PaginationState,
} from "@/components/data-table-user";
import { useUnits } from "@/hooks/use-unit";

const UNIT_STATUS_STYLES = {
  available: "bg-noti-positive-subtle text-black-2",
  out: "bg-noti-warning-subtle text-black-2",
  repair: "bg-muted text-muted-foreground",
  lost: "bg-negative-subtle text-negative-primary",
} as const;

function formatUnitStatus(status: keyof typeof UNIT_STATUS_STYLES) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function CalculatorsPage() {
  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, error, isLoading } = useUnits({
    itemType: "calculator",
    isActive: true,
    page,
    search: search || undefined,
  });
  const pageData = data?.data;
  const pagination: PaginationState = {
    page: pageData?.page ?? page,
    pageSize: pageData?.pageSize ?? 20,
    total: pageData?.total ?? 0,
    totalPages: Math.ceil(
      (pageData?.total ?? 0) / (pageData?.pageSize ?? 20),
    ),
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-black-1">
          Calculators
        </h1>
        <p className="text-sm text-black-3">
          Browse available calculators.
        </p>
      </header>

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-black-4" />
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search code or notes"
          className="border-orange-subtle-2 pl-8 focus-visible:border-orange-primary focus-visible:ring-orange-subtle-1"
          aria-label="Search calculators by code or notes"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-negative-primary">
          Unable to load calculators: {error.message}
        </p>
      )}

      <DataTableUser
        data={pageData?.items ?? []}
        getItem={(unit) => ({
          id: unit.id,
          title: unit.code,
          description: unit.note ?? undefined,
          status: {
            label: formatUnitStatus(unit.status),
            className: UNIT_STATUS_STYLES[unit.status],
          },
          href: `/calculators/${unit.code}`,
          actionLabel: "more",
        })}
        pagination={pagination}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No calculators match your search."
      />
    </main>
  );
}
