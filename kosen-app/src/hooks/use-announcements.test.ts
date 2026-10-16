import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAnnouncementQuery } from "@/hooks/use-announcements";
import { EMPTY_FILTERS } from "@/lib/announcement/types";

describe("buildAnnouncementQuery", () => {
  it("always sends the page, which is required", () => {
    assert.equal(buildAnnouncementQuery(3, EMPTY_FILTERS), "page=3");
  });

  it("omits unfiltered values entirely rather than sending 'all'", () => {
    const query = buildAnnouncementQuery(1, EMPTY_FILTERS);

    // `parseListQuery` tries to parse searchYear as a number, so `all` would 400.
    assert.equal(query.includes("all"), false);
    assert.equal(query.includes("searchYear"), false);
    assert.equal(query.includes("searchDepartment"), false);
    assert.equal(query.includes("searchType"), false);
    assert.equal(query.includes("searchName"), false);
  });

  it("omits a blank or whitespace-only searchName", () => {
    for (const searchName of ["", "   ", "\t"]) {
      const query = buildAnnouncementQuery(1, { ...EMPTY_FILTERS, searchName });
      assert.equal(
        query.includes("searchName"),
        false,
        `for ${JSON.stringify(searchName)}`,
      );
    }
  });

  it("trims the search term", () => {
    const params = new URLSearchParams(
      buildAnnouncementQuery(1, { ...EMPTY_FILTERS, searchName: "  forum  " }),
    );
    assert.equal(params.get("searchName"), "forum");
  });

  it("passes every filter through when it is set", () => {
    const params = new URLSearchParams(
      buildAnnouncementQuery(2, {
        searchName: "forum",
        searchYear: 3,
        searchDepartment: "Mechatronics Engineering",
        searchType: "student affair",
      }),
    );

    assert.equal(params.get("page"), "2");
    assert.equal(params.get("searchName"), "forum");
    assert.equal(params.get("searchYear"), "3");
    assert.equal(params.get("searchDepartment"), "Mechatronics Engineering");
    assert.equal(params.get("searchType"), "student affair");
  });

  it("keeps year 0 and 'all' distinguishable", () => {
    // `0` is falsy — a naive `if (filters.searchYear)` would drop it.
    const params = new URLSearchParams(
      buildAnnouncementQuery(1, { ...EMPTY_FILTERS, searchYear: 0 }),
    );
    assert.equal(params.get("searchYear"), "0");
  });

  it("round-trips type values that contain spaces", () => {
    const query = buildAnnouncementQuery(1, {
      ...EMPTY_FILTERS,
      searchType: "student affair",
    });

    // Encoded on the wire as `+` or `%20`, but decoded identically.
    const decoded = new URLSearchParams(query).get("searchType");
    assert.equal(decoded, "student affair");
  });
});
