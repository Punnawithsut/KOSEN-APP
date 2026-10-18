/**
 * Client-side types for the announcement feature.
 *
 * `Announcement` mirrors the detail API contract in
 * `src/app/api/announcement/announcement.service.ts` (`serializeAnnouncement`).
 * List responses use the narrower `AnnouncementListItem` below. Note the API
 * renames fields relative to the DB:
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

/** Full announcement detail as returned by GET /api/announcement/[id]. */
export type Announcement = {
  id: string;
  name: string;
  description: string;
  /**
   * The announcement's banner, already resolved to a signed Supabase URL (or
   * `null`). Separate from `files` — the detail screen shows this at the top
   * while `files` feeds the attachment chips and the gallery.
   */
  titleImageUrl: string | null;
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

/** Minimal fields needed to render one row in GET /api/announcement. */
export type AnnouncementListItem = {
  id: string;
  name: string;
  description: string;
  hasTitleImage: boolean;
  createdAt: string;
};

/** The `data` payload of `GET /api/announcement/[id]`. */
export type AnnouncementDetailData = Announcement;

/** A file whose `url` is known to be resolved — what the detail screen renders. */
export type ResolvedAnnouncementFile = AnnouncementFile & { url: string };

/**
 * Splits `files` into what the detail screen shows where.
 *
 * `fileType` carries the raw MIME type (see `uploadAnnouncementFiles`), so the
 * split is on the `image/` prefix rather than on a hand-maintained enum — a new
 * image format needs no change here.
 *
 * Files with an unresolved `url` are dropped by the type predicate, which is
 * also what lets the components render `file.url` without a non-null assertion.
 */
export function splitAnnouncementFiles(files: AnnouncementFile[]): {
  images: ResolvedAnnouncementFile[];
  attachments: ResolvedAnnouncementFile[];
} {
  const resolved = [...files]
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .filter((file): file is ResolvedAnnouncementFile => Boolean(file.url));

  const isImage = (file: ResolvedAnnouncementFile) =>
    Boolean(file.type?.startsWith("image/"));

  return {
    images: resolved.filter(isImage),
    attachments: resolved.filter((file) => !isImage(file)),
  };
}

/** Pagination metadata from `listAnnouncements`. */
export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/** The `data` payload of `GET /api/announcement`. */
export type AnnouncementListData = {
  items: AnnouncementListItem[];
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
