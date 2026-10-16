"use client";

import { useCallback, useState } from "react";

import { AnnouncementFilterBar } from "@/components/announcement/announcement-filter-bar";
import { AnnouncementHero } from "@/components/announcement/announcement-hero";
import { AnnouncementList } from "@/components/announcement/announcement-list";
import { AnnouncementPagination } from "@/components/announcement/announcement-pagination";
import { AnnouncementToast } from "@/components/announcement/announcement-toast";
import { useAnnouncements } from "@/hooks/use-announcements";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useMyProfile } from "@/hooks/use-profile";
import type { AnnouncementFilters, FilterMode } from "@/lib/announcement/types";

const PROFILE_INCOMPLETE_MESSAGE =
  "Please configure your student year and department first.";

/**
 * The dropdown-only slice of the filters.
 *
 * The search box is tracked separately because it is debounced, so the request
 * filters below are DERIVED from both. Deriving instead of storing is what lets
 * this component stay free of state-syncing effects.
 */
type DropdownFilters = Omit<AnnouncementFilters, "searchName">;

const EMPTY_DROPDOWN_FILTERS: DropdownFilters = {
  searchYear: "all",
  searchDepartment: "all",
  searchType: "all",
};

/**
 * Announcement list screen (student view).
 *
 * This component owns all the state; every child below it is presentational.
 *   - `filters`  -> what the API should narrow by
 *   - `mode`     -> which quick-filter button looks active
 *   - `searchInput` -> the raw text in the box, debounced before it becomes a filter
 */
export default function AnnouncementPage() {
  const [page, setPage] = useState(1);
  const [dropdownFilters, setDropdownFilters] = useState<DropdownFilters>(
    EMPTY_DROPDOWN_FILTERS,
  );
  const [mode, setMode] = useState<FilterMode>("all");
  const [searchInput, setSearchInput] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Only the settled search term should hit the network.
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // Derived, never stored — this is the single source of truth for the request.
  const filters: AnnouncementFilters = {
    searchName: debouncedSearch,
    ...dropdownFilters,
  };

  const { data: profile, isLoading: profilePending } = useMyProfile();
  const { items, pagination, isLoading, isValidating, error, refetch } =
    useAnnouncements({ page, filters });

  // Each handler below also resets `page`, because a new filter invalidates the
  // current offset. Doing that here (instead of in an effect) is what keeps this
  // component free of state-syncing effects.
  const handleFilterChange = useCallback((patch: Partial<DropdownFilters>) => {
    setMode("custom");
    setToastMessage(null);
    setPage(1);
    setDropdownFilters((previous) => ({ ...previous, ...patch }));
  }, []);

  /** Typing resets to page 1 immediately; the term itself is debounced. */
  const handleSearchChange = useCallback((value: string) => {
    setMode("custom");
    setPage(1);
    setSearchInput(value);
  }, []);

  const handleAll = useCallback(() => {
    setMode("all");
    setToastMessage(null);
    setSearchInput("");
    setPage(1);
    setDropdownFilters(EMPTY_DROPDOWN_FILTERS);
  }, []);

  /** "For you" = announcements aimed at this student's own year + department. */
  const handleForYou = useCallback(() => {
    const department = profile?.department;
    const year = profile?.year;

    if (!department || !year) {
      setToastMessage(PROFILE_INCOMPLETE_MESSAGE);
      return;
    }

    setMode("for-you");
    setToastMessage(null);
    setSearchInput("");
    setPage(1);
    setDropdownFilters((previous) => ({
      ...previous,
      searchYear: year,
      searchDepartment: department,
    }));
  }, [profile]);

  const dismissToast = useCallback(() => setToastMessage(null), []);

  return (
    <main className="min-h-screen bg-bg-primary pb-10">
      {/* Full-bleed: the desktop design has the dome fill the whole first screen. */}
      <AnnouncementHero />

      {/* Content column. The Figma desktop frame is 1920 wide with a 1522-wide
          card (79.3%), so from `lg` up the column tracks the viewport at that
          ratio and stops at the design's 1522px. */}
      <div className="mx-auto flex w-full max-w-[430px] flex-col md:max-w-3xl lg:w-[79.3%] lg:max-w-[1522px]">
        <AnnouncementFilterBar
          filters={filters}
          mode={mode}
          searchValue={searchInput}
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange}
          onForYou={handleForYou}
          onAll={handleAll}
          profilePending={profilePending}
        />

        {toastMessage ? (
          <div className="px-4 md:px-6">
            <AnnouncementToast
              message={toastMessage}
              onDismiss={dismissToast}
              actionHref="/profile"
            />
          </div>
        ) : null}

        <div className="px-4 pt-4 md:px-6">
          <AnnouncementList
            items={items}
            isLoading={isLoading}
            error={error}
            onRetry={() => {
              void refetch();
            }}
          />

          <AnnouncementPagination
            page={page}
            totalPages={pagination?.totalPages ?? 1}
            disabled={isValidating}
            onChange={setPage}
          />
        </div>
      </div>
      <a href="/test">test</a>
    </main>
  );
}
