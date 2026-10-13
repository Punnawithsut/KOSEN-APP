import useSWR, { type SWRConfiguration } from "swr";
import { apiFetcher, ApiError } from "./fetcher";

//e.g. -> const { data, error, isLoading, mutate } = useApi<Profile>("/api/profile");
export function useApi<T = unknown>(url: string | null, config?: SWRConfiguration<T, ApiError>) {
    return useSWR<T, ApiError>(url, apiFetcher, config);
}