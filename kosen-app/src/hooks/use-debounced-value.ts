import { useEffect, useState } from "react";

/**
 * Returns `value`, but delayed: the returned value only updates once `value`
 * has stopped changing for `delayMs`.
 *
 * Why this exists: the search box is typed into character-by-character. Without
 * debouncing, every keystroke would change the SWR key and fire a request.
 * With it, the user gets one request ~300ms after they stop typing.
 *
 * How it works:
 *   - Each time `value` changes, the previous timer is cleared and a fresh one
 *     starts (the cleanup function below is what cancels it).
 *   - Only when a timer survives the full delay does the state update.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    // Runs before the next effect AND on unmount -> prevents stale timers.
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
