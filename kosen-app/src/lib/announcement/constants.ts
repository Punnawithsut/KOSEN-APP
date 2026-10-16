/**
 * Filter option lists for the announcement filter bar.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Why `enabled` exists
 * ─────────────────────────────────────────────────────────────────────────────
 * The design calls for a wider taxonomy than the backend currently accepts.
 * `announcement.service.ts` only allows:
 *   searchType       ∈ for_you | news | events
 *   searchDepartment ∈ Computer Engineering | Mechanical Engineering |
 *                      Electrical and Electronics Engineering
 *   searchYear       ∈ 1..5
 * Anything else makes `parseType` / `parseYear` throw a 400.
 *
 * So every option carries `enabled`:
 *   - `enabled: true`  -> the backend accepts it today; it is selectable.
 *   - `enabled: false` -> rendered in the dropdown but NOT selectable, marked
 *                         "(soon)". Flip to `true` once the backend lands.
 *
 * When the backend enum/department work ships, this file is the ONLY thing
 * that changes — no component edits.
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
 * The design shows short labels (`Computer`, `Electrical & …`) while the API
 * validates full names, so `label` and `value` differ here on purpose.
 */
export const DEPARTMENTS: FilterOption<string>[] = [
  { label: "Computer", value: "Computer Engineering", enabled: true },
  { label: "Mechanical", value: "Mechanical Engineering", enabled: true },
  {
    label: "Electrical & Electronics",
    value: "Electrical and Electronics Engineering",
    enabled: true,
  },
  // Appears in the design, but the backend has no matching value yet.
  { label: "Mechatronic", value: "Mechatronic", enabled: false },
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
 * NONE of these are accepted by the current backend enum
 * (`announcement_category` = for_you | news | events), so the whole dropdown
 * renders disabled until the schema migration ships.
 */
export const TYPES: FilterOption<string>[] = [
  { label: "Student Affairs", value: "student_affair", enabled: false },
  { label: "Dormitory", value: "dormitory", enabled: false },
  { label: "Industrial Linkage", value: "industrial_linkage", enabled: false },
  {
    label: "International Affairs",
    value: "international_affair",
    enabled: false,
  },
  { label: "Academic Affairs", value: "academic_affair", enabled: false },
  { label: "Club", value: "club", enabled: false },
  { label: "Others", value: "others", enabled: false },
];

/** True when the Type dropdown has nothing selectable yet. */
export const TYPES_READY = TYPES.some((option) => option.enabled);
