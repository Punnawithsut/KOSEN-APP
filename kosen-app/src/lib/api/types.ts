/** Shared API envelope used by hooks and server-prefetched responses. */
export type ApiResponse<T = void> = {
  ok?: boolean;
  error?: string;
  reason?: string;
  message?: string;
} & (T extends void ? { data?: T } : { data: T });
