import { ApiError } from "@/lib/api/fetcher";

/**
 * Maps an SWR error onto something a student can act on.
 *
 * `apiFetcher` throws `ApiError`, which carries the HTTP `status` but not the
 * API's own message (that lives under `{ ok: false, error }`, which the fetcher
 * does not read), so we branch on `status` here. Shared by the list and the
 * detail screen so the two cannot drift apart.
 */
export function describeAnnouncementError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Please sign in to view announcements.";
    if (error.status === 403) return "You do not have access to announcements.";
    if (error.status === 404) return "That announcement no longer exists.";
    if (error.status === 400) {
      return "That filter combination is not supported yet.";
    }
    return `Could not load announcements (error ${error.status}).`;
  }

  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong while loading announcements.";
}
