"use client";

import { useState } from "react";
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
import { FORMS, HANDBOOK, RULES, STAFF } from "@/lib/dormitory/data";

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
 */
export default function DormitoryPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();

  const rules = RULES.filter(
    (rule) => !query || includes(rule.title, query) || includes(rule.body, query),
  );
  const forms = FORMS.filter(
    (form) =>
      !query || includes(form.title, query) || includes(form.description, query),
  );
  const staff = STAFF.filter(
    (person) =>
      !query || includes(person.name, query) || includes(person.role, query),
  );
  const showHandbook = !query || includes(HANDBOOK.title, query);

  const hasHandbook = showHandbook || rules.length > 0;
  const show = {
    handbook: (tab === "all" || tab === "handbook") && hasHandbook,
    forms: (tab === "all" || tab === "forms") && forms.length > 0,
    staff: (tab === "all" || tab === "staff") && staff.length > 0,
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
              handbook={HANDBOOK}
              rules={rules}
              showHandbook={showHandbook}
            />
          ) : null}
          {show.forms ? <FormsSection forms={forms} /> : null}
          {show.staff ? <StaffSection staff={staff} /> : null}

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
