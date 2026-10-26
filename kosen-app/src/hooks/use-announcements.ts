import { useApi } from "@/lib/api/use-api";
import {
  EMPTY_FILTERS,
  type AnnouncementFilters,
  type AnnouncementListData,
  type ApiResponse,
} from "@/lib/announcement/types";

/**
 * Turns the UI's filter state into a `/api/announcement` query string.
 *
 * Anything the user has NOT filtered on is omitted entirely — we never send
 * `?searchYear=all`, because `parseListQuery` would try to parse it as a number.
 * Kept as a separate, pure function so it can be reasoned about (and tested)
 * without React.
 */
export function buildAnnouncementQuery(
  page: number,
  filters: AnnouncementFilters,
): string {
  const params = new URLSearchParams();
  params.set("page", String(page)); // required, must be >= 1

  const name = filters.searchName.trim();
  if (name) params.set("searchName", name);

  if (filters.searchYear !== "all") {
    params.set("searchYear", String(filters.searchYear));
  }
  if (filters.searchDepartment !== "all") {
    params.set("searchDepartment", filters.searchDepartment);
  }
  if (filters.searchType !== "all") {
    params.set("searchType", filters.searchType);
  }

  return params.toString();
}

type UseAnnouncementsOptions = {
  page: number;
  filters?: AnnouncementFilters;
};

/**
 * Loads one page of announcements.
 *
 * This is a thin wrapper over `useApi` (SWR). Because SWR keys off the URL
 * string, changing a filter or the page automatically triggers a refetch —
 * there is no `useEffect` here on purpose.
 *
 * `keepPreviousData: true` keeps the current page's items on screen while the
 * next request is in flight, so the list does not flash empty when you page.
 */
export function useAnnouncements({page, filters = EMPTY_FILTERS,}: UseAnnouncementsOptions, fallbackData?: ApiResponse<AnnouncementListData>) {
  const url = `/api/announcement?${buildAnnouncementQuery(page, filters)}`;

  const { data, error, isLoading, isValidating, mutate } = useApi<
    ApiResponse<AnnouncementListData>
  >(url, {
    fallbackData,
    keepPreviousData: true,
    // SWR retries 5x on ANY error by default. A 401/403 will never fix itself
    // by retrying, so retrying just floods the API with doomed requests.
    shouldRetryOnError: (err) => err.status !== 401 && err.status !== 403,
  });

  return {
    items: data?.data?.items ?? [],
    pagination: data?.data?.pagination ?? null,
    /** True only while there is no data at all yet (first load). */
    isLoading,
    /** True while any request is in flight, including background refreshes. */
    isValidating,
    error,
    refetch: mutate,
  };
}
