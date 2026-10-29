import { useApi } from "@/lib/api/use-api";
import type { ApiResponse } from "@/lib/api/types";
import type { AnnouncementDetailData } from "@/lib/announcement/types";

/**
 * Loads a single announcement.
 *
 * Same SWR shape as `useAnnouncements`, minus pagination and
 * `keepPreviousData` — there is nothing meaningful to keep on screen while a
 * different id loads, so the skeleton state is correct there.
 *
 * `id` is nullable because `useParams()` does not narrow on its own; passing
 * `null` parks SWR instead of requesting `/api/announcement/`.
 */
export function useAnnouncement(id: string | null, fallbackData?: ApiResponse<AnnouncementDetailData>) {
  const { data, error, isLoading, isValidating, mutate } = useApi<
    ApiResponse<AnnouncementDetailData>
  >(id ? `/api/announcement/${id}` : null, {
    fallbackData,
    // A 401/403/404 will never fix itself by retrying, so retrying just floods
    // the API with doomed requests.
    shouldRetryOnError: (err) =>
      err.status !== 401 && err.status !== 403 && err.status !== 404,
  });

  return {
    announcement: data?.data ?? null,
    isLoading: isLoading && !data,
    isValidating,
    error,
    refetch: mutate,
  };
}
