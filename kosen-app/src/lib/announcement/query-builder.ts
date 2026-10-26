import { EMPTY_FILTERS, type AnnouncementFilters } from "@/lib/announcement/types";

export function buildAnnouncementQuery(
  page: number,
  filters: AnnouncementFilters = EMPTY_FILTERS,
): string {
  const params = new URLSearchParams();
  params.set("page", String(page));

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