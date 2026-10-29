import { useDelete, usePost, usePut } from "@/lib/api/use-mutation";
import { useApi } from "@/lib/api/use-api";
import type { ApiResponse } from "@/lib/api/types";
import type {
  CreateSlotData,
  PagedData,
  Slot,
  SlotFilters,
  UpdateSlotData,
} from "@/types/klongklongplus-types";
import { queryString } from "@/types/klongklongplus-types";

const SLOTS_URL = "/api/klongklongplus/slots";

export function useSlots(filters: SlotFilters = {}, enabled = true) {
  const { page = 1, ...query } = filters;
  const url = `${SLOTS_URL}${queryString({ ...query, page })}`;
  return useApi<ApiResponse<PagedData<Slot>>>(enabled ? url : null);
}

export function useAvailableSlots(
  unitId: string | null,
  slotDate: string,
  enabled = true,
  excludeLoanId?: string,
) {
  const url =
    unitId && slotDate
      ? `/api/klongklongplus/loans/available-slots${queryString({ unitId, slotDate, excludeLoanId })}`
      : null;
  return useApi<ApiResponse<Slot[]>>(enabled ? url : null);
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
  return useDelete<ApiResponse>(url, {
    revalidateKeyPrefixes: [SLOTS_URL, url],
  });
}

export type { CreateSlotData, Slot, SlotFilters, UpdateSlotData };
