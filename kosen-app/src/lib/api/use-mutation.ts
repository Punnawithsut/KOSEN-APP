import useSWRMutation from "swr/mutation";
import { useSWRConfig } from "swr";
import { apiErrorFromResponse, ApiError } from "./fetcher";

type Method = "POST" | "PATCH" | "PUT" | "DELETE";

type MutationArg<Body = unknown> = {
  method: Method;
  body?: Body;
};

async function sender<T = unknown>(
  url: string,
  { arg }: { arg: MutationArg },
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const options: RequestInit = {
    method: arg.method,
    headers,
  };

  // Only add body if present
  if (arg.body !== undefined) {
    options.body = JSON.stringify(arg.body);
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    throw await apiErrorFromResponse(res);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export function useApiMutation<T = unknown, Body = unknown>(url: string) {
  return useSWRMutation<T, ApiError, string, MutationArg<Body>>(url, sender);
}

type MutationOptions = {
  revalidateKeys?: string | string[];
  revalidateKeyPrefixes?: string | string[];
};

function useMethodMutation<T = unknown, Body = unknown>(
  url: string,
  method: Method,
  options?: MutationOptions,
) {
  const { trigger, ...rest } = useApiMutation<T, Body>(url);
  const { mutate } = useSWRConfig();

  async function run(body?: Body) {
    const hasRevalidationTargets =
      options?.revalidateKeys || options?.revalidateKeyPrefixes;
    const result = await trigger(
      { method, body },
      hasRevalidationTargets ? { revalidate: false } : undefined,
    );
    if (options?.revalidateKeys) {
      const keys = Array.isArray(options.revalidateKeys)
        ? options.revalidateKeys
        : [options.revalidateKeys];
      await Promise.all(keys.map((key) => mutate(key)));
    }
    if (options?.revalidateKeyPrefixes) {
      const prefixes = Array.isArray(options.revalidateKeyPrefixes)
        ? options.revalidateKeyPrefixes
        : [options.revalidateKeyPrefixes];
      await Promise.all(
        prefixes.map((prefix) =>
          mutate(
            (key) =>
              typeof key === "string" &&
              (key === prefix ||
                key.startsWith(`${prefix}?`) ||
                key.startsWith(`${prefix}/`)),
          ),
        ),
      );
    }
    return result;
  }

  return { ...rest, trigger: run };
}

/** const { trigger: createThing, isMutating } = usePost("/api/things");
 *  await createThing({ name: "..." }); */

export function usePost<T = unknown, Body = unknown>(
  url: string,
  options?: MutationOptions,
) {
  return useMethodMutation<T, Body>(url, "POST", options);
}

/** const { trigger: saveProfile, isMutating } = usePatch("/api/profile");
 *  await saveProfile(form); */
export function usePatch<T = unknown, Body = unknown>(
  url: string,
  options?: MutationOptions,
) {
  return useMethodMutation<T, Body>(url, "PATCH", options);
}

export function usePut<T = unknown, Body = unknown>(
  url: string,
  options?: MutationOptions,
) {
  return useMethodMutation<T, Body>(url, "PUT", options);
}

/** const { trigger: deleteThing, isMutating } = useDelete("/api/things/123");
 *  await deleteThing(); // no body needed */
export function useDelete<T = unknown>(url: string, options?: MutationOptions) {
  const { trigger, ...rest } = useMethodMutation<T>(url, "DELETE", options);
  return { ...rest, trigger: () => trigger(undefined) };
}
