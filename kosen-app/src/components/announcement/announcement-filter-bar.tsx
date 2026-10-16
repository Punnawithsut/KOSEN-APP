"use client";

import { ChevronDownIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEPARTMENTS,
  TYPES,
  TYPES_READY,
  YEARS,
  type FilterOption,
} from "@/lib/announcement/constants";
import type { AnnouncementFilters, FilterMode } from "@/lib/announcement/types";
import { cn } from "@/lib/utils";

type AnnouncementFilterBarProps = {
  filters: AnnouncementFilters;
  mode: FilterMode;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (patch: Partial<AnnouncementFilters>) => void;
  onForYou: () => void;
  onAll: () => void;
  /** True while the student's profile is still loading. */
  profilePending?: boolean;
};

type FilterSelectProps = {
  label: string;
  value: string | number;
  options: FilterOption<string>[] | FilterOption<number>[];
  disabled?: boolean;
  onChange: (value: string) => void;
};

/** Shared styling for the three dropdowns. */
function FilterSelect({
  label,
  value,
  options,
  disabled = false,
  onChange,
}: FilterSelectProps) {
  return (
    <div className="relative min-w-0 flex-1 md:w-32 md:flex-none">
      <select
        aria-label={label}
        value={String(value)}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "w-full appearance-none truncate rounded-xl border bg-white py-1.5 pr-7 pl-2.5 text-[11px] text-blue-secondary outline-none",
          "border-transparent focus-visible:border-blue-primary focus-visible:ring-2 focus-visible:ring-blue-subtle-1",
          disabled && "cursor-not-allowed bg-white/60 text-blue-secondary/40",
        )}
      >
        <option value="all">{label}: all</option>
        {options.map((option) => (
          <option
            key={String(option.value)}
            value={String(option.value)}
            disabled={!option.enabled}
          >
            {option.label}
            {option.enabled ? "" : " (soon)"}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2",
          disabled ? "text-blue-secondary/30" : "text-blue-secondary/70",
        )}
      />
    </div>
  );
}

/** Segmented "For you" / "All" quick filters. */
function QuickFilterButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-7 rounded-full px-4 text-[11px] font-medium shadow-none",
        active
          ? "bg-blue-secondary text-white hover:bg-blue-secondary/90"
          : "bg-white/70 text-blue-secondary hover:bg-white",
      )}
    >
      {children}
    </Button>
  );
}

/**
 * Filter controls for the announcement list.
 *
 * Pure presentation: it owns no state. The parent page owns `filters`, `mode`
 * and the search text, and receives changes through the callbacks below.
 */
export function AnnouncementFilterBar({
  filters,
  mode,
  searchValue,
  onSearchChange,
  onFilterChange,
  onForYou,
  onAll,
  profilePending = false,
}: AnnouncementFilterBarProps) {
  return (
    <section aria-label="Announcement filters" className="px-4 pt-3 md:px-6">
      {/* Light-blue surface, matching the design's filter bar. */}
      <div className="flex flex-col gap-2 rounded-2xl bg-blue-subtle-2 p-2 md:flex-row md:items-center md:gap-3">
        {/* Quick filters */}
        <div className="flex gap-2 md:shrink-0">
          <QuickFilterButton
            active={mode === "for-you"}
            disabled={profilePending}
            onClick={onForYou}
          >
            {profilePending ? "Loading…" : "For you"}
          </QuickFilterButton>
          <QuickFilterButton active={mode === "all"} onClick={onAll}>
            All
          </QuickFilterButton>
        </div>

        {/* Search */}
        <div className="relative md:flex-1">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-blue-secondary/70"
          />
          <Input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search announcements"
            className="h-8 rounded-xl border-transparent bg-white pl-8 text-xs"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex gap-2 md:shrink-0">
          <FilterSelect
            label="Year"
            value={filters.searchYear}
            options={YEARS}
            onChange={(value) =>
              onFilterChange({
                searchYear: value === "all" ? "all" : Number(value),
              })
            }
          />
          <FilterSelect
            label="Department"
            value={filters.searchDepartment}
            options={DEPARTMENTS}
            onChange={(value) => onFilterChange({ searchDepartment: value })}
          />
          <FilterSelect
            label="Type"
            value={filters.searchType}
            options={TYPES}
            disabled={!TYPES_READY}
            onChange={(value) => onFilterChange({ searchType: value })}
          />
        </div>
      </div>
    </section>
  );
}
