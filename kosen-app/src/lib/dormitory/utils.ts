import {
  STAFF_POSITIONS,
  type DormStaff,
  type OfficeHour,
} from "@/lib/dormitory/data";

/** Insert `item`, or replace the entry with the same id. */
export function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((entry) => entry.id === item.id)
    ? list.map((entry) => (entry.id === item.id ? item : entry))
    : [...list, item];
}

export function newId(): string {
  return crypto.randomUUID();
}

/** "Aug 18, 2026" — the format the "Updated …" labels use. */
export function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** ISO timestamp -> "YYYY-MM-DD" in local time, for `<input type="date">`. */
export function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** "YYYY-MM-DD" -> ISO timestamp at the end of that local day. */
export function fromDateInput(value: string): string | null {
  return value ? new Date(`${value}T23:59:59`).toISOString() : null;
}

export const GOOGLE_FORM_PATTERN =
  /^https:\/\/(docs\.google\.com\/forms|forms\.gle\/|forms\.google\.com)/i;

const POSITION_ORDER = Object.keys(STAFF_POSITIONS);

/** Most senior position first; stable within a position. */
export function sortStaff(staff: DormStaff[]): DormStaff[] {
  return [...staff].sort(
    (a, b) =>
      POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position),
  );
}

/** { Tue, 13:00, 22:00 } -> "Tue, 13.00-22.00" */
export function formatOfficeHour({ day, start, end }: OfficeHour): string {
  return `${day}, ${start.replace(":", ".")}-${end.replace(":", ".")}`;
}
