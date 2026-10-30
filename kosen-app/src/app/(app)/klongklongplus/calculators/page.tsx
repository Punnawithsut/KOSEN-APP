import { listUnits } from "@/app/api/klongklongplus/units/unit.service";
import type { ApiResponse } from "@/lib/api/types";
import type { PagedData, Unit } from "@/types/klongklongplus-types";
import { serializeDates } from "@/lib/api/serialize-dates";

import CalculatorsView from "./calculators-view";

export const dynamic = "force-dynamic";

/**
 * Server-rendered shell for the calculators list.
 *
 * Prefetches exactly the state the client opens on — page 1, no search — and
 * hands it to the view as SWR fallback data, so the first paint already has
 * rows. Any other state (a search term, a later page) still goes through the
 * API; a fallback only applies to the key it was fetched for.
 *
 * The prefetch is best-effort: on failure this renders the view with no
 * fallback and the client fetches for itself, which is exactly how the page
 * behaved before.
 */
export default async function CalculatorsPage() {
  let initialUnits: ApiResponse<PagedData<Unit>> | undefined;

  try {
    const units = await listUnits(
      { itemType: "calculator", isActive: true },
      1,
    );
    initialUnits = { ok: true, data: serializeDates<PagedData<Unit>>(units) };
  } catch (error) {
    console.error("[SSR Prefetch] Failed to prefetch calculators:", error);
  }

  return (
    <div className="bg-bg-primary">
      <CalculatorsView initialUnits={initialUnits} />
    </div>
  );
}
