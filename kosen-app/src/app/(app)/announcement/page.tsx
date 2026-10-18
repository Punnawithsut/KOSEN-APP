"use client";

import { useCallback, useState } from "react";
import { PlusIcon } from "lucide-react";

import { AnnouncementDeleteDialog } from "@/components/announcement/announcement-delete-dialog";
import { AnnouncementFilterBar } from "@/components/announcement/announcement-filter-bar";
import { AnnouncementFormDialog } from "@/components/announcement/announcement-form-dialog";
import { AnnouncementHero } from "@/components/announcement/announcement-hero";
import { AnnouncementList } from "@/components/announcement/announcement-list";
import { AnnouncementPagination } from "@/components/announcement/announcement-pagination";
import { AnnouncementToast } from "@/components/announcement/announcement-toast";
import { Button } from "@/components/ui/button";
import { useAnnouncements } from "@/hooks/use-announcements";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useMyProfile } from "@/hooks/use-profile";
import { apiFetcher } from "@/lib/api/fetcher";
import type {
  Announcement,
  AnnouncementDetailData,
  AnnouncementFilters,
  AnnouncementListItem,
  ApiResponse,
  FilterMode,
} from "@/lib/announcement/types";

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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  // The form dialog serves both modes: creating is tracked by `isFormOpen`,
  // editing by this. Closing them through one handler keeps them from drifting.
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<AnnouncementListItem | null>(null);

  function closeForm() {
    setIsFormOpen(false);
    setEditing(null);
  }

  async function handleEdit(announcement: AnnouncementListItem) {
    if (editingId) return;

    setEditingId(announcement.id);
    setToastMessage(null);
    try {
      const response = await apiFetcher<ApiResponse<AnnouncementDetailData>>(
        `/api/announcement/${announcement.id}`,
      );
      if (!response.data) {
        throw new Error("The announcement details were missing from the response.");
      }
      setEditing(response.data);
    } catch (error) {
      setToastMessage(
        error instanceof Error
          ? error.message
          : "Could not load announcement details.",
      );
    } finally {
      setEditingId(null);
    }
  }

  // Only the settled search term should hit the network.
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // Derived, never stored — this is the single source of truth for the request.
  const filters: AnnouncementFilters = {
    searchName: debouncedSearch,
    ...dropdownFilters,
  };

  const { data: profileResponse, isLoading: profilePending } = useMyProfile();
  const { items, pagination, isLoading, isValidating, error, refetch } =
    useAnnouncements({ page, filters });

  // `useMyProfile` hands back the raw `{ data }` envelope, same as the profile
  // screen does. Unwrapping it once here keeps every read below on the profile
  // itself rather than on an envelope.
  const profile = profileResponse?.data;

  // Admins get the write controls overlaid on the same screen the students see,
  // so there is no second route to keep in sync.
  const isAdmin = profile?.role === "admin";

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
    <main className="min-h-screen  pb-10">
      {/* Full-bleed: the desktop design has the dome fill the whole first screen. */}
      <AnnouncementHero />

      {/* Content column. The Figma desktop frame is 1920 wide with a 1522-wide
          card (79.3%), so from `lg` up the column tracks the viewport at that
          ratio and stops at the design's 1522px. */}
      <div className="mx-auto flex w-full max-w-[430px] flex-col md:max-w-3xl lg:w-[79.3%] lg:max-w-[1522px]">
        {/* Locks just under the fixed navbar once the hero has scrolled past.
            `sticky` alone gives that: the bar rides up with the page and pins at
            `top` only once the hero is gone — no scroll listener, no state.

            The parent box is this content column, so the bar stops sticking at
            the bottom of the list, which is what we want.

            `top-0` on phones because the nav is a bottom tab bar there;
            `md:top-16` matches the desktop bar's exact h-16. The solid
            background is required — without it the list shows through as it
            scrolls underneath. `z-40` stays under the navbar's `z-50`. */}
        <div className="sticky top-0 z-40  pb-2 md:top-16">
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
        </div>

        {toastMessage ? (
          <div className="px-4 md:px-6">
            <AnnouncementToast
              message={toastMessage}
              onDismiss={dismissToast}
              actionHref={
                toastMessage === PROFILE_INCOMPLETE_MESSAGE
                  ? "/profile"
                  : undefined
              }
            />
          </div>
        ) : null}

        <div className="px-4 pt-4 md:px-6">
          <AnnouncementList
            items={items}
            isLoading={isLoading}
            error={error}
            onEdit={isAdmin ? handleEdit : undefined}
            onDelete={isAdmin ? setDeleting : undefined}
            editingId={editingId}
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

      {/* Always-on create button for admins. `fixed` rather than `sticky`: a
          sticky box that sits below the fold is pinned to the viewport edge from
          the moment it mounts, so it would behave the same here but come with a
          containing-block dependency on the content column. Matches the
          klongklongplus FAB — `bottom-24` clears the h-16 mobile tab bar, and
          `z-40` stays under the navbar's `z-50`. */}
      {isAdmin ? (
        <Button
          type="button"
          size="icon-lg"
          aria-label="New announcement"
          onClick={() => setIsFormOpen(true)}
          className="animate-in fade-in zoom-in-95 fixed right-6 bottom-24 z-40 size-14 rounded-full bg-orange-secondary text-white shadow-lg duration-150 hover:brightness-90 md:bottom-6"
        >
          <PlusIcon className="size-6" />
        </Button>
      ) : null}

      {isAdmin ? (
        <AnnouncementFormDialog
          // Remount per record so the fields are initialised from the right
          // announcement instead of being synced into state by an effect. The
          // key cycles through "create" on every close, so re-opening the same
          // announcement still gets a fresh remount.
          key={editing?.id ?? "create"}
          open={isFormOpen || editing !== null}
          announcement={editing}
          onOpenChange={(open) => {
            if (!open) closeForm();
          }}
          onSaved={() => {
            void refetch();
          }}
        />
      ) : null}

      {isAdmin ? (
        <AnnouncementDeleteDialog
          announcement={deleting}
          onOpenChange={(open) => {
            if (!open) setDeleting(null);
          }}
          onDeleted={() => {
            void refetch();
          }}
        />
      ) : null}
    </main>
  );
}
