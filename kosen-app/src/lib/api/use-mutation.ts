import useSWRMutation from "swr/mutation";
import { useSWRConfig } from "swr";
import { ApiError } from "./fetcher";

type Method = "POST" | "PATCH" | "PUT" | "DELETE";

type MutationArg = {
    method: Method;
    body?: unknown;
}

async function sender<T = unknown>(url: string, { arg }: { arg: MutationArg}): Promise<T> {
    const res = await fetch(
        url,
        {
            method: arg.method,
            headers: arg.body !== undefined ? { "Content-Type" : "application/json" } : undefined,
            body: arg.body !== undefined ? JSON.stringify(arg.body) : undefined,
        }
    );
    if(!res.ok) {
        const info = await res.json().catch(() => null);
        const message = (info as { message?: string } | null)?.message?? `Request failed (${res.status})`;
        throw new ApiError(message, res.status, info);
    }
    if (res.status === 204) return undefined as T;
    return res.json();
}

export function useApiMutation<T = unknown>(url: string) {
    return useSWRMutation<T, ApiError, string, MutationArg>(url, sender);
}

type MutationOptions = {
    revalidateKeys?: string | string[];
}

function useMethodMutation<T = unknown>(url: string, method: Method, options?: MutationOptions) {
  const { trigger, ...rest } = useApiMutation<T>(url);
  const { mutate } = useSWRConfig();
 
  async function run(body?: unknown) {
    const result = await trigger({ method, body });
    if (options?.revalidateKeys) {
      const keys = Array.isArray(options.revalidateKeys)
        ? options.revalidateKeys
        : [options.revalidateKeys];
      await Promise.all(keys.map((key) => mutate(key)));
    }
    return result;
  }
 
  return { ...rest, trigger: run };
}

/** const { trigger: createThing, isMutating } = usePost("/api/things");
 *  await createThing({ name: "..." }); */

export function usePost<T = unknown>(url: string, options?: MutationOptions) {
  return useMethodMutation<T>(url, "POST", options);
}
 
/** const { trigger: saveProfile, isMutating } = usePatch("/api/profile", { revalidateKeys: "/api/profile" });
 *  await saveProfile(form); */
export function usePatch<T = unknown>(url: string, options?: MutationOptions) {
  return useMethodMutation<T>(url, "PATCH", options);
}
 
export function usePut<T = unknown>(url: string, options?: MutationOptions) {
  return useMethodMutation<T>(url, "PUT", options);
}
 
/** const { trigger: deleteThing, isMutating } = useDelete("/api/things/123");
 *  await deleteThing(); // no body needed */
export function useDelete<T = unknown>(url: string, options?: MutationOptions) {
  const { trigger, ...rest } = useMethodMutation<T>(url, "DELETE", options);
  return { ...rest, trigger: () => trigger(undefined) };
}
