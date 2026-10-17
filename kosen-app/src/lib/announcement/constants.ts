/**
 * Filter option lists for the announcement filter bar.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * How `enabled` is used
 * ─────────────────────────────────────────────────────────────────────────────
 * Every option is checked against the server-side allow-lists in
 * `announcement.service.ts`:
 *   searchType       ∈ student affair | dormitory | industrial linkage |
 *                      international affair | academic affair | club | others
 *   searchDepartment ∈ Computer Engineering | Mechatronics Engineering |
 *                      Electrical and Electronics Engineering
 *   searchYear       ∈ 1..5
 * Anything else makes `parseType` / `parseYear` throw a 400.
 *
 *   - `enabled: true`  -> the backend accepts it; it is selectable.
 *   - `enabled: false` -> rendered in the dropdown but NOT selectable, marked
 *                         "(soon)". Flip to `true` once the backend lands.
 *
 * Only `adv.` is still disabled: `parseYear` rejects anything outside 1..5.
 */

export type FilterOption<T extends string | number> = {
  /** Text shown to the user. */
  label: string;
  /** Value sent to the API (`value` may differ from `label`). */
  value: T;
  /** `false` renders the option disabled in the dropdown. */
  enabled: boolean;
};

/** The "no filter" entry shared by every dropdown. */
export const ALL_VALUE = "all";

/**
 * Departments.
 * Mirrors `ALLOWED_DEPARTMENTS` in `announcement.service.ts`.
 * The design shows short labels (`Computer`, `Electrical & …`) while the API
 * validates full names, so `label` and `value` differ here on purpose.
 */
export const DEPARTMENTS: FilterOption<string>[] = [
  { label: "Computer", value: "Computer Engineering", enabled: true },
  { label: "Mechatronics", value: "Mechatronics Engineering", enabled: true },
  {
    label: "Electrical & Electronics",
    value: "Electrical and Electronics Engineering",
    enabled: true,
  },
];

/**
 * Academic years. The design adds `adv.`, which the API rejects
 * (`parseYear` enforces 1..5), so it stays disabled for now.
 */
export const YEARS: FilterOption<number>[] = [
  { label: "1", value: 1, enabled: true },
  { label: "2", value: 2, enabled: true },
  { label: "3", value: 3, enabled: true },
  { label: "4", value: 4, enabled: true },
  { label: "5", value: 5, enabled: true },
  { label: "adv.", value: 6, enabled: false },
];

/**
 * Announcement categories.
 *
 * Mirrors the `announcement_category` enum in `db/schema.ts`. The stored values
 * contain spaces (`"student affair"`, not `"student_affair"`), so they are sent
 * URL-encoded in the `searchType` query param.
 */
export const TYPES: FilterOption<string>[] = [
  { label: "Student Affairs", value: "student affair", enabled: true },
  { label: "Dormitory", value: "dormitory", enabled: true },
  { label: "Industrial Linkage", value: "industrial linkage", enabled: true },
  {
    label: "International Affairs",
    value: "international affair",
    enabled: true,
  },
  { label: "Academic Affairs", value: "academic affair", enabled: true },
  { label: "Club", value: "club", enabled: true },
  { label: "Others", value: "others", enabled: true },
];

/** True when the Type dropdown has nothing selectable yet. */
export const TYPES_READY = TYPES.some((option) => option.enabled);
