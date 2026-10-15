"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  DataTableUser,
  type PaginationState,
} from "@/components/data-table-user";

/* ------------------------------- Mock backend ------------------------------ */

interface Calculator {
  id: number;
  name: string;
  description: string;
  updatedAt: string; // ISO date
  slug: string;
}

const PAGE_SIZE = 5; // owned by the backend; never sent in requests

const NAMES = [
  "Loan installment calculator",
  "Savings interest calculator",
  "Retirement planner",
  "Debt payoff estimator",
  "Currency converter",
  "Tax estimator",
  "Mortgage affordability",
  "Insurance premium estimate",
];

const ALL_CALCULATORS: Calculator[] = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  name: `${NAMES[i % NAMES.length]}${i >= NAMES.length ? ` ${Math.floor(i / NAMES.length) + 1}` : ""}`,
  description:
    "Enter a few numbers and see a clear breakdown you can adjust and compare. Results update as you type.",
  updatedAt: new Date(2026, 9, 14 - i).toISOString(),
  slug: `calculator-${i + 1}`,
}));

async function fetchCalculators(params: { page: number; search: string }) {
  await new Promise((r) => setTimeout(r, 700));
  const q = params.search.trim().toLowerCase();
  const filtered = ALL_CALCULATORS.filter((c) => !q || c.name.toLowerCase().includes(q));
  const start = (params.page - 1) * PAGE_SIZE;
  return {
    items: filtered.slice(start, start + PAGE_SIZE),
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / PAGE_SIZE),
  };
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${String(d.getFullYear()).slice(-2)}`;
};

/* ---------------------------------- Page ---------------------------------- */

export default function UserDemoPage() {
  const [rows, setRows] = React.useState<Calculator[]>([]);
  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [meta, setMeta] = React.useState({ total: 0, totalPages: 0 });
  const requestKey = JSON.stringify([page, search]);
  const [loadedRequestKey, setLoadedRequestKey] = React.useState<string | null>(
    null,
  );
  const isLoading = loadedRequestKey !== requestKey;

  // Debounced search; changing it resets to page 1.
  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch((prev) => {
        if (prev !== searchInput) setPage(1);
        return searchInput;
      });
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  React.useEffect(() => {
    let cancelled = false;
    fetchCalculators({ page, search }).then((res) => {
      if (cancelled) return;
      setRows(res.items);
      setMeta({ total: res.total, totalPages: res.totalPages });
      setLoadedRequestKey(requestKey);
    });
    return () => {
      cancelled = true;
    };
  }, [page, search, requestKey]);

  const pagination: PaginationState = {
    page,
    pageSize: PAGE_SIZE,
    total: meta.total,
    totalPages: meta.totalPages,
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-black-1">Calculators</h1>
        <p className="text-sm text-black-3">Pick a calculator to get started.</p>
      </header>

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-black-4" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search calculators"
          className="border-orange-subtle-2 pl-8 focus-visible:border-orange-primary focus-visible:ring-orange-subtle-1"
          aria-label="Search calculators"
        />
      </div>

      <DataTableUser
        data={rows}
        getItem={(c) => ({
          id: c.id,
          title: c.name,
          description: c.description,
          meta: `post on ${formatDate(c.updatedAt)}`,
          href: `/calculators/${c.slug}`,
          actionLabel: "more",
        })}
        pagination={pagination}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No calculators match your search. Try a different keyword."
      />
    </main>
  );
}