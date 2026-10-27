import { useDelete, usePatch, usePost, usePut } from "@/lib/api/use-mutation";
import { useApi } from "@/lib/api/use-api";
import type {
  ApiMutationResponse,
  ApiResponse,
  CreateUnitData,
  PagedData,
  Unit,
  UnitFilters,
  UpdateUnitData,
  UnitStatus,
} from "@/hooks/types/klongklongplus-types";
import { queryString } from "@/hooks/types/klongklongplus-types";

const UNITS_URL = "/api/klongklongplus/units";

export function useUnits(
  filters: UnitFilters = {},
  fallbackData?: ApiResponse<PagedData<Unit>>,
) {
  const { page = 1, ...query } = filters;
  const url = `${UNITS_URL}${queryString({ ...query, page })}`;
  return useApi<ApiResponse<PagedData<Unit>>>(url, { fallbackData });
}

export function useCreateUnit() {
  return usePost<ApiResponse<Unit>, CreateUnitData>(UNITS_URL, {
    revalidateKeyPrefixes: UNITS_URL,
  });
}

export function useUpdateUnit(id: string) {
  const url = `${UNITS_URL}/${encodeURIComponent(id)}`;
  return usePut<ApiResponse<Unit>, UpdateUnitData>(url, {
    revalidateKeyPrefixes: [UNITS_URL, url],
  });
}

export function useDeleteUnit(id: string) {
  const url = `${UNITS_URL}/${encodeURIComponent(id)}`;
  return useDelete<ApiMutationResponse>(url, {
    revalidateKeyPrefixes: [UNITS_URL, url],
  });
}

export function useUpdateUnitStatus(id: string) {
  const url = `${UNITS_URL}/${encodeURIComponent(id)}/status`;
  return usePatch<ApiResponse<Unit>, { status: UnitStatus }>(url, {
    revalidateKeyPrefixes: [UNITS_URL, url],
  });
}

export type { CreateUnitData, Unit, UnitFilters, UpdateUnitData, UnitStatus };
