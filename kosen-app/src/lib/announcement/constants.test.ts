import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { announcementCategoryEnum } from "@/db/schema";
import {
  DEPARTMENTS,
  TYPES,
  TYPES_READY,
  YEARS,
  type FilterOption,
} from "@/lib/announcement/constants";

function values<T extends string | number>(options: FilterOption<T>[]): T[] {
  return options.map((option) => option.value);
}

/**
 * Pulls a `const NAME = ["a", "b"] as const` array out of a source file.
 *
 * Deliberately crude. `announcement.service.ts` can't be imported into a test:
 * it pulls in Drizzle and opens a connection pool. So the only handle we have
 * on its allow-lists is the source text — and the guard is worth it, because
 * `constants.ts` drifting from those lists has already shipped once
 * (`Mechanical Engineering` -> `Mechatronics Engineering`), which silently
 * returned zero results instead of erroring.
 */
function readStringArray(relativePath: string, constName: string): string[] {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const block = source.match(
    new RegExp(`${constName}\\s*=\\s*\\[([^\\]]*)\\]`),
  );
  assert.ok(block, `could not find ${constName} in ${relativePath}`);
  return [...block[1].matchAll(/["']([^"']+)["']/g)].map((match) => match[1]);
}

const SERVICE = "../../app/api/announcement/announcement.service.ts";

describe("announcement filter constants", () => {
  it("keeps TYPES in sync with the announcement_category enum", () => {
    assert.deepEqual(
      values(TYPES).toSorted(),
      [...announcementCategoryEnum.enumValues].toSorted(),
    );
  });

  it("keeps TYPES in sync with the API allow-list", () => {
    assert.deepEqual(
      values(TYPES).toSorted(),
      readStringArray(SERVICE, "ALLOWED_TYPES").toSorted(),
    );
  });

  it("keeps DEPARTMENTS in sync with the API allow-list", () => {
    assert.deepEqual(
      values(DEPARTMENTS).toSorted(),
      readStringArray(SERVICE, "ALLOWED_DEPARTMENTS").toSorted(),
    );
  });

  it("has no duplicate values in any dropdown", () => {
    for (const [name, options] of [
      ["DEPARTMENTS", DEPARTMENTS],
      ["TYPES", TYPES],
      ["YEARS", YEARS],
    ] as const) {
      // Mapped inline rather than through `values()`: `options` is a union of
      // `FilterOption<string>[]` and `FilterOption<number>[]` here, which the
      // generic helper can't unify.
      const seen = options.map((option) => option.value);
      assert.equal(
        new Set(seen).size,
        seen.length,
        `${name} contains a duplicate value`,
      );
    }
  });

  it("gives every option a label and a non-empty value", () => {
    for (const options of [DEPARTMENTS, TYPES, YEARS]) {
      for (const option of options) {
        assert.ok(option.label.trim(), `empty label for ${option.value}`);
        assert.notEqual(String(option.value).trim(), "");
      }
    }
  });

  it("enables the Type dropdown now that the backend accepts every value", () => {
    assert.equal(TYPES_READY, true);
    assert.ok(TYPES.every((option) => option.enabled));
  });

  it("keeps the adv. year disabled because parseYear rejects anything past 5", () => {
    const advanced = YEARS.find((option) => option.value === 6);
    assert.ok(advanced, "expected an adv. year option");
    assert.equal(advanced.enabled, false);
    assert.ok(
      YEARS.filter((option) => option.value !== 6).every(
        (option) => option.value >= 1 && option.value <= 5 && option.enabled,
      ),
    );
  });
});
