import { useApi } from "@/lib/api/use-api";
import { useDelete, usePatch, usePost, usePut } from "@/lib/api/use-mutation";
import type {
  ApiMutationResponse,
  ApiResponse,
  CreateLoanData,
  LoanFilters,
  LoanRecord,
  PagedData,
  UpdateLoanData,
} from "@/hooks/types/klongklongplus-types";
import { queryString } from "@/hooks/types/klongklongplus-types";

const LOANS_URL = "/api/klongklongplus/loans";
const MY_LOANS_URL = `${LOANS_URL}/mine`;

function loanMutationOptions(id?: string) {
  const prefixes = [LOANS_URL, MY_LOANS_URL];
  if (id) prefixes.push(`${LOANS_URL}/${encodeURIComponent(id)}`);
  return { revalidateKeyPrefixes: prefixes };
}

export function useLoans(filters: LoanFilters = {}) {
  const { page = 1, ...query } = filters;
  const url = `${LOANS_URL}${queryString({ ...query, page })}`;
  return useApi<ApiResponse<PagedData<LoanRecord>>>(url);
}

export function useMyLoans(
  page = 1,
  filters: LoanFilters = {},
  fallbackData?: ApiResponse<PagedData<LoanRecord>>,
) {
  const url = `${MY_LOANS_URL}${queryString({ ...filters, page })}`;
  return useApi<ApiResponse<PagedData<LoanRecord>>>(url, { fallbackData });
}

export function useCreateLoan() {
  return usePost<ApiMutationResponse<LoanRecord>, CreateLoanData>(
    LOANS_URL,
    loanMutationOptions(),
  );
}

export function useUpdateLoan(id: string) {
  const url = `${LOANS_URL}/${encodeURIComponent(id)}`;
  return usePut<ApiMutationResponse<LoanRecord>, UpdateLoanData>(
    url,
    loanMutationOptions(id),
  );
}

export function useDeleteLoan(id: string) {
  const url = `${LOANS_URL}/${encodeURIComponent(id)}`;
  return useDelete<ApiMutationResponse>(url, loanMutationOptions(id));
}

function useLoanAction<Body = undefined>(id: string, action: string) {
  const url = `${LOANS_URL}/${encodeURIComponent(id)}/${action}`;
  return usePatch<ApiMutationResponse<LoanRecord>, Body>(
    url,
    loanMutationOptions(id),
  );
}

export function useAcceptLoan(id: string) {
  return useLoanAction(id, "accept");
}

export function useCancelLoan(id: string) {
  return useLoanAction<{ reason: string }>(id, "cancel");
}

export function useDeliverLoan(id: string) {
  return useLoanAction<{ condition?: string }>(id, "deliver");
}

export function useMarkLoanNoShow(id: string) {
  return useLoanAction(id, "no-show");
}

export function useReassignLoan(id: string) {
  return useLoanAction(id, "reassign");
}

export function useRejectLoan(id: string) {
  return useLoanAction<{ reason: string }>(id, "reject");
}

export function useReleaseLoan(id: string) {
  return useLoanAction(id, "release");
}

export function useReturnLoan(id: string) {
  return useLoanAction<{ condition?: string }>(id, "return");
}

export type { CreateLoanData, LoanFilters, LoanRecord, UpdateLoanData };
