import { useApi } from "@/lib/api/use-api";
import { buildAnnouncementQuery } from "@/lib/announcement/query-builder";
import {
  EMPTY_FILTERS,
  type AnnouncementFilters,
  type AnnouncementListData,
} from "@/lib/announcement/types";
import type { ApiResponse } from "@/lib/api/types";

export { buildAnnouncementQuery };

type UseAnnouncementsOptions = {
  page: number;
  filters?: AnnouncementFilters;
};

export function useAnnouncements(
  { page, filters = EMPTY_FILTERS }: UseAnnouncementsOptions,
  fallbackData?: ApiResponse<AnnouncementListData>
) {
  const url = `/api/announcement?${buildAnnouncementQuery(page, filters)}`;

  const { data, error, isLoading, isValidating, mutate } = useApi<
    ApiResponse<AnnouncementListData>
  >(url, {
    fallbackData,
    keepPreviousData: true,
    shouldRetryOnError: (err) => err.status !== 401 && err.status !== 403,
  });

  return {
    items: data?.data?.items ?? [],
    pagination: data?.data?.pagination ?? null,
    isLoading: isLoading && !data,
    isValidating,
    error,
    refetch: mutate,
  };
}
