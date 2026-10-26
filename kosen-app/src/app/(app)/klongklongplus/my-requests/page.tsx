import { listUserLoans } from "@/app/api/klongklongplus/loans/loan.service";
import type {
  ApiResponse,
  LoanRecord,
  PagedData,
} from "@/hooks/types/klongklongplus-types";
import { serializeDates } from "@/lib/api/serialize-dates";
import { createClient } from "@/lib/supabase/server";

import MyRequestsView from "./my-requests-view";

/**
 * Server-rendered shell for a student's own loan requests.
 *
 * The user has to be resolved here because the service takes an id rather than
 * reading it from a request. `(app)/layout.tsx` already redirects anonymous
 * visitors, so a missing user here means the session expired mid-render — in
 * which case the view is rendered without a fallback rather than guessing.
 *
 * Only page 1 with no filters is prefetched: that is the state the client opens
 * on, and a SWR fallback only applies to the key it was fetched for.
 */
export default async function MyRequestsPage() {
  let initialLoans: ApiResponse<PagedData<LoanRecord>> | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const loans = await listUserLoans(user.id, 1);
      initialLoans = {
        ok: true,
        data: serializeDates<PagedData<LoanRecord>>(loans),
      };
    }
  } catch (error) {
    console.error("[SSR Prefetch] Failed to prefetch loan requests:", error);
  }

  return <MyRequestsView initialLoans={initialLoans} />;
}
