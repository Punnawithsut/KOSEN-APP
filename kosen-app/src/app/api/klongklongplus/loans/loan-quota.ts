export const MAX_APPROVED_LOANS_PER_TERM = 3;

export function hasReachedTermLoanQuota(quotaSlotsInUse: number) {
  return quotaSlotsInUse >= MAX_APPROVED_LOANS_PER_TERM;
}
