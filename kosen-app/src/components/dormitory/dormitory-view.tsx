"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  BookOpenIcon,
  FileTextIcon,
  LayoutGridIcon,
  SearchIcon,
  SearchXIcon,
  UserIcon,
  type LucideIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { FormsSection } from "@/components/dormitory/forms-section";
import { HandbookSection } from "@/components/dormitory/handbook-section";
import { StaffSection } from "@/components/dormitory/staff-section";
import {
  type DormHandbook,
} from "@/lib/dormitory/data";
import { STAFF_POSITIONS } from "@/lib/dormitory/data";
import { adaptDormData } from "@/lib/dormitory/adapter";
import { apiFetcher } from "@/lib/api/fetcher";
import type { ApiError } from "@/lib/api/fetcher";
import { useToast } from "@/hooks/use-toast";

type Tab = "all" | "handbook" | "forms" | "staff";

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "all", label: "All", icon: LayoutGridIcon },
  { id: "handbook", label: "Handbook & Rules", icon: BookOpenIcon },
  { id: "forms", label: "Forms", icon: FileTextIcon },
  { id: "staff", label: "Contact Staff", icon: UserIcon },
];

const includes = (text: string, query: string) =>
  text.toLowerCase().includes(query);

/**
 * Dormitory screen. One page, four tabs; the search box narrows whatever the
 * active tab shows, and "All" shows every section that still has a match.
 *
 * Admins get edit/add controls overlaid on the same screen. The content is
 * still local state seeded from `@/lib/dormitory/data`, so edits last until
 * the page is reloaded; swap the setters for API calls to persist them.
 */
type DormApi = { ok: true; data: { wardens: Record<string, unknown>[]; forms: Record<string, unknown>[]; rules: Record<string, unknown>[]; handbook: DormHandbook | null } };

export function DormitoryView({ isAdmin = false, initialData }: { isAdmin?: boolean; initialData?: DormApi }) {
  const { data, mutate } = useSWR<DormApi, ApiError>("/api/dorm", apiFetcher, { fallbackData: initialData });
  const { toast } = useToast();
  const adapted = data?.data ? adaptDormData(data.data) : { staff: [], forms: [], rules: [], handbook: { title: "Dormitory Handbook", edition: "", pages: 0, updatedAt: "—", fileName: null, pdfUrl: null } as DormHandbook };
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const handbook = adapted.handbook;
  const allRules = adapted.rules;
  const allForms = adapted.forms;
  const allStaff = adapted.staff;
  async function save(url: string, method: "POST" | "PUT" | "DELETE", body?: Record<string, unknown>) {
    const response = await fetch(url, { method, ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
    if (!response.ok) {
      const result = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(result?.error ?? `Request failed (${response.status})`);
    }
    await mutate();
  }
  function reportSave(task: Promise<void>, label: string) {
    void task.then(() => toast({ title: `${label} saved`, variant: "success" })).catch((error: unknown) => toast({ title: `Could not save ${label.toLowerCase()}`, description: error instanceof Error ? error.message : "Please try again.", variant: "error" }));
  }
  const query = search.trim().toLowerCase();

  const rules = allRules.filter(
    (rule) => !query || includes(rule.title, query) || includes(rule.body, query),
  );
  const forms = allForms.filter(
    (form) =>
      !query || includes(form.title, query) || includes(form.description, query),
  );
  const staff = allStaff.filter(
    (person) =>
      !query ||
      includes(person.name, query) ||
      includes(person.nickname, query) ||
      includes(STAFF_POSITIONS[person.position], query),
  );
  const showHandbook = !query || includes(handbook.title, query);

  // Admins keep every section visible so an empty one can still be added to.
  const hasHandbook = showHandbook || rules.length > 0;
  const show = {
    handbook: (tab === "all" || tab === "handbook") && (hasHandbook || isAdmin),
    forms: (tab === "all" || tab === "forms") && (forms.length > 0 || isAdmin),
    staff: (tab === "all" || tab === "staff") && (staff.length > 0 || isAdmin),
  };
  const empty = !show.handbook && !show.forms && !show.staff;

  return (
    <main className="min-h-screen bg-white pb-10">
      <div className="mx-auto flex w-full max-w-[430px] flex-col md:max-w-3xl lg:max-w-6xl">
        {/* Plain block at the top of the page: scrolls away with the content. */}
        <div className="px-4 pt-4 md:px-6">
          {/* Light-blue surface, same as the announcement filter bar. */}
          <div className="flex flex-col gap-2 rounded-2xl bg-blue-subtle-2 p-2 md:flex-row md:items-center md:gap-3">
            <div
              role="tablist"
              aria-label="Dormitory sections"
              className="flex gap-1 overflow-x-auto [scrollbar-width:none]"
            >
              {TABS.map(({ id, label, icon: Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(id)}
                    className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-secondary ${
                      active
                        ? "bg-blue-secondary text-white"
                        : "bg-white/70 text-blue-secondary hover:bg-white"
                    }`}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="relative md:flex-1">
              <SearchIcon
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-blue-secondary/70"
              />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search rules, forms ..."
                aria-label="Search rules, forms and staff"
                className="h-8 rounded-xl border-transparent bg-white pl-8 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-10 px-4 pt-4 md:px-6">
          {show.handbook ? (
            <HandbookSection
              handbook={handbook}
              rules={rules}
              showHandbook={showHandbook}
              isAdmin={isAdmin}
              onHandbookChange={(next) => { if (next) mutate(); }}
              onRuleSave={(rule) => { const existing = allRules.some((item) => item.id === rule.id); reportSave(save(existing ? `/api/dorm/rule/${rule.id}` : "/api/dorm/rule", existing ? "PUT" : "POST", { name: rule.title, rule_description: rule.body }), "Rule"); }}
            />
          ) : null}
          {show.forms ? (
            <FormsSection
              forms={forms}
              allForms={allForms}
              isAdmin={isAdmin}
              onSave={(form) => { const existing = allForms.some((item) => item.id === form.id); reportSave(save(existing ? `/api/dorm/forms/${form.id}` : "/api/dorm/forms", existing ? "PUT" : "POST", { name: form.title, description: form.description, formsURL: form.url, dueDate: form.closesAt }), "Form"); }}
            />
          ) : null}
          {show.staff ? (
            <StaffSection
              staff={staff}
              isAdmin={isAdmin}
              onSave={(person) => {
                if (!person.officeHours.length) { toast({ title: "Add an office hour", variant: "error" }); return; }
                const existing = allStaff.find((item) => item.id === person.id);
                const dayFor = (day: (typeof person.officeHours)[number]["day"]) => ({ Mon: "monday", Tue: "tuesday", Wed: "wednesday", Thu: "thursday", Fri: "friday", Sat: "saturday", Sun: "sunday" } as const)[day];
                const bodyFor = (hour: (typeof person.officeHours)[number]) => ({ name: person.name, role: STAFF_POSITIONS[person.position], lineID: person.lineId, phone: person.phone, officeDay: dayFor(hour.day), officeStartTime: hour.start, officeEndTime: hour.end });
                const changes = person.officeHours.map((hour) => save(hour.recordId ? `/api/dorm/dormwardens/${hour.recordId}` : "/api/dorm/dormwardens", hour.recordId ? "PUT" : "POST", bodyFor(hour)));
                const keptIds = new Set(person.officeHours.map((hour) => hour.recordId).filter(Boolean));
                for (const oldHour of existing?.officeHours ?? []) if (oldHour.recordId && !keptIds.has(oldHour.recordId)) changes.push(save(`/api/dorm/dormwardens/${oldHour.recordId}`, "DELETE"));
                reportSave(Promise.all(changes).then(() => undefined).then(() => mutate()).then(() => undefined), "Staff");
              }}
            />
          ) : null}

          {empty ? (
            <div
              role="status"
              className="flex flex-col items-center gap-2 py-16 text-center"
            >
              <SearchXIcon className="size-10 text-black-4" />
              <p className="font-medium text-black-2">
                Nothing found{query ? ` for “${search.trim()}”` : ""}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setTab("all");
                }}
                className="text-sm font-semibold text-orange-secondary underline-offset-4 hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
