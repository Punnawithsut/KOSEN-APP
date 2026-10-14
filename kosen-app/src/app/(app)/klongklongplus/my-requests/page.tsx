"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTable,
  type DataTableColumn,
  type PaginationState,
} from "@/components/data-table";

/* ------------------------------- Mock backend ------------------------------ */

type Status = "Published" | "Draft" | "Archived";

interface Announcement {
  id: number;
  title: string;
  author: string;
  status: Status;
  publishedAt: string;
}

const PAGE_SIZE = 5; // owned by the backend; never sent in requests

const TITLES = [
  "Scheduled maintenance window",
  "New loan rates effective next month",
  "Holiday opening hours",
  "Mobile app version 3.2 released",
  "Updated privacy policy",
  "Branch relocation notice",
  "Year-end statement availability",
  "Security best practices reminder",
];
const AUTHORS = ["Napat S.", "Mali K.", "Arthit P.", "Pim R."];
const STATUSES: Status[] = ["Published", "Draft", "Archived"];

const ALL_ANNOUNCEMENTS: Announcement[] = Array.from({ length: 47 }, (_, i) => ({
  id: i + 1,
  title: `${TITLES[i % TITLES.length]} #${i + 1}`,
  author: AUTHORS[i % AUTHORS.length],
  status: STATUSES[(i * 7) % STATUSES.length],
  publishedAt: new Date(2026, 9, 14 - i).toISOString().slice(0, 10),
}));

async function fetchAnnouncements(params: {
  page: number; // 1-based
  search: string;
  status: Status | "All";
}) {
  await new Promise((r) => setTimeout(r, 700)); // simulate network latency

  const q = params.search.trim().toLowerCase();
  const filtered = ALL_ANNOUNCEMENTS.filter(
    (a) =>
      (params.status === "All" || a.status === params.status) &&
      (!q || a.title.toLowerCase().includes(q) || a.author.toLowerCase().includes(q)),
  );

  const start = (params.page - 1) * PAGE_SIZE;
  return {
    items: filtered.slice(start, start + PAGE_SIZE),
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / PAGE_SIZE),
  };
}

/* --------------------------------- Columns -------------------------------- */

const STATUS_STYLES: Record<Status, string> = {
  Published: "bg-noti-positive-subtle text-black-2",
  Draft: "bg-noti-warning-subtle text-black-2",
  Archived: "bg-muted text-muted-foreground",
};

const columns: DataTableColumn<Announcement>[] = [
  { key: "id", header: "#", className: "w-16 tabular-nums text-muted-foreground" },
  { key: "title", header: "Title", className: "font-medium" },
  { key: "author", header: "Author" },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status]}`}
      >
        {row.status}
      </span>
    ),
  },
  { key: "publishedAt", header: "Date", className: "tabular-nums text-muted-foreground" },
];

/* ---------------------------------- Page ---------------------------------- */

const FILTERS: (Status | "All")[] = ["All", "Published", "Draft", "Archived"];

export default function DemoPage() {
  const [rows, setRows] = React.useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState(""); // debounced
  const [status, setStatus] = React.useState<Status | "All">("All");

  const [meta, setMeta] = React.useState({ total: 0, totalPages: 0 });

  // Debounce search; changing the filter always resets to page 1.
  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch((prev) => {
        if (prev !== searchInput) setPage(1);
        return searchInput;
      });
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleStatusChange = (next: Status | "All") => {
    setStatus(next);
    setPage(1);
  };

  // Fetch whenever page or filters change. The cleanup flag ignores stale responses.
  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchAnnouncements({ page, search, status }).then((res) => {
      if (cancelled) return;
      setRows(res.items);
      setMeta({ total: res.total, totalPages: res.totalPages });
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [page, search, status]);

  const pagination: PaginationState = {
    page,
    pageSize: PAGE_SIZE,
    total: meta.total,
    totalPages: meta.totalPages,
  };

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
        <p className="text-sm text-muted-foreground">
          Server-side pagination with search and status filters.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search title or author"
            className="pl-8"
            aria-label="Search announcements"
          />
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={status === f ? "default" : "outline"}
              onClick={() => handleStatusChange(f)}
              aria-pressed={status === f}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        pagination={pagination}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No announcements match your search. Try a different keyword or status."
      />
    </main>
  );
}