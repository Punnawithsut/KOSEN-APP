import { useDelete, usePost, usePut } from "@/lib/api/use-mutation";
import { useApi } from "@/lib/api/use-api";
import type { ApiResponse } from "@/lib/api/types";
import type {
  CreateTermData,
  PagedData,
  Term,
  UpdateTermData,
} from "@/types/klongklongplus-types";
import { queryString } from "@/types/klongklongplus-types";

const TERMS_URL = "/api/klongklongplus/terms";

export function useTerms({
  page = 1,
  search,
}: {
  page?: number;
  search?: string;
} = {}) {
  const url = `${TERMS_URL}${queryString({ page, search })}`;
  return useApi<ApiResponse<PagedData<Term>>>(url);
}

export function useTerm(id: string | null) {
  const url = id ? `${TERMS_URL}/${encodeURIComponent(id)}` : null;
  return useApi<ApiResponse<Term>>(url);
}

export function useCurrentTerm(enabled = true) {
  return useApi<ApiResponse<Term>>(enabled ? `${TERMS_URL}/current` : null);
}

export function useCreateTerm() {
  return usePost<ApiResponse<Term>, CreateTermData>(TERMS_URL, {
    revalidateKeyPrefixes: TERMS_URL,
  });
}

export function useUpdateTerm(id: string) {
  const url = `${TERMS_URL}/${encodeURIComponent(id)}`;
  return usePut<ApiResponse<Term>, UpdateTermData>(url, {
    revalidateKeyPrefixes: [TERMS_URL, url],
  });
}

export function useDeleteTerm(id: string) {
  const url = `${TERMS_URL}/${encodeURIComponent(id)}`;
  return useDelete<ApiResponse>(url, {
    revalidateKeyPrefixes: [TERMS_URL, url],
  });
}

export type { CreateTermData, Term, UpdateTermData };
