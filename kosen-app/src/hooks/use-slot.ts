import { useDelete, usePost, usePut } from "@/lib/api/use-mutation";
import { useApi } from "@/lib/api/use-api";
import type {
  ApiMutationResponse,
  ApiResponse,
  CreateSlotData,
  PagedData,
  Slot,
  SlotFilters,
  UpdateSlotData,
} from "@/hooks/types/klongklongplus-types";
import { queryString } from "@/hooks/types/klongklongplus-types";

const SLOTS_URL = "/api/klongklongplus/slots";

export function useSlots(filters: SlotFilters = {}) {
  const { page = 1, ...query } = filters;
  const url = `${SLOTS_URL}${queryString({ ...query, page })}`;
  return useApi<ApiResponse<PagedData<Slot>>>(url);
}

export function useSlot(id: string | null) {
  const url = id ? `${SLOTS_URL}/${encodeURIComponent(id)}` : null;
  return useApi<ApiResponse<Slot>>(url);
}

export function useCreateSlot() {
  return usePost<ApiResponse<Slot>, CreateSlotData>(SLOTS_URL, {
    revalidateKeyPrefixes: SLOTS_URL,
  });
}

export function useUpdateSlot(id: string) {
  const url = `${SLOTS_URL}/${encodeURIComponent(id)}`;
  return usePut<ApiResponse<Slot>, UpdateSlotData>(url, {
    revalidateKeyPrefixes: [SLOTS_URL, url],
  });
}

export function useDeleteSlot(id: string) {
  const url = `${SLOTS_URL}/${encodeURIComponent(id)}`;
  return useDelete<ApiMutationResponse>(url, {
    revalidateKeyPrefixes: [SLOTS_URL, url],
  });
}

export type { CreateSlotData, Slot, SlotFilters, UpdateSlotData };
