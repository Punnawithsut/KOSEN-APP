/**
 * Recursively turns `Date` instances into ISO strings.
 *
 * Server components can hand a `Date` across the RSC boundary, but every client
 * type here declares those fields as `string` — the shape they get from the API,
 * where JSON has already stringified them. Prefetched data has to match that
 * shape exactly: code like `value.split("-")` on a slot date throws when handed
 * a `Date`, and it would only fail on the prefetched render, never on a refetch.
 *
 * Using this at the boundary makes prefetched data byte-for-byte what the same
 * request would have returned through `fetch`, so there is one shape to reason
 * about instead of two.
 *
 * The caller names the target type — `serializeDates<PagedData<Unit>>(rows)` —
 * because the input is a database row shape and the output is the client shape,
 * and only the caller knows the latter. Returning `T` from an inferred `T`
 * would keep the `Date` types and defeat the point.
 */
export function serializeDates<T>(value: unknown): T {
  if (value instanceof Date) return value.toISOString() as T;
  if (Array.isArray(value)) {
    return value.map((entry) => serializeDates<unknown>(entry)) as T;
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        serializeDates<unknown>(entry),
      ]),
    ) as T;
  }

  return value as T;
}
