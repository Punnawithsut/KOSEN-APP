/**
 * Client-side types for the announcement feature.
 *
 * These mirror the API contract in `src/app/api/announcement/announcement.service.ts`
 * (`serializeAnnouncement`). Note the API renames fields relative to the DB:
 *   title -> name | content -> description | targetYear -> year
 *   targetDepartment -> department | category -> type
 *
 * We intentionally do NOT import from the API route files: those pull in
 * Drizzle/server-only code, which must not end up in the browser bundle.
 */

/** One uploaded file. `url` is a signed Supabase URL (or null if unresolved). */
export type AnnouncementFile = {
  url: string | null;
  type: string | null;
  displayOrder: number | null;
};

/** One announcement as returned by the API. */
export type Announcement = {
  id: string;
  name: string;
  description: string;
  /** `"all"` when the announcement targets every year. */
  year: number | "all";
  /** `"all"` when the announcement targets every department. */
  department: string;
  /** `"all"` when the announcement has no category. */
  type: string;
  files: AnnouncementFile[];
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Pagination metadata from `listAnnouncements`. */
export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/** The `data` payload of `GET /api/announcement`. */
export type AnnouncementListData = {
  items: Announcement[];
  pagination: Pagination;
};

/** The envelope every route in this project returns (see `_shared/errors.ts`). */
export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  reason?: string;
  message?: string;
};

/**
 * The four filter values the UI owns.
 * The literal `"all"` (and `""` for the name) means "no filter applied" — the
 * query builder omits those params entirely, so the API never sees them.
 */
export type AnnouncementFilters = {
  searchName: string;
  searchYear: "all" | number;
  searchDepartment: string;
  searchType: string;
};

export const EMPTY_FILTERS: AnnouncementFilters = {
  searchName: "",
  searchYear: "all",
  searchDepartment: "all",
  searchType: "all",
};

/**
 * Which of the two quick-filter buttons is currently "active".
 * `"custom"` means the user hand-picked at least one filter.
 */
export type FilterMode = "for-you" | "all" | "custom";
