import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApiError } from "@/lib/api/fetcher";
import { describeAnnouncementError } from "@/lib/announcement/errors";
import {
  splitAnnouncementFiles,
  type AnnouncementFile,
} from "@/lib/announcement/types";

function file(overrides: Partial<AnnouncementFile>): AnnouncementFile {
  return {
    url: "https://cdn.test/a.png",
    type: "image/png",
    displayOrder: 0,
    ...overrides,
  };
}

describe("splitAnnouncementFiles", () => {
  it("returns empty buckets for no files", () => {
    assert.deepEqual(splitAnnouncementFiles([]), {
      images: [],
      attachments: [],
    });
  });

  it("routes on the image/ MIME prefix, not the URL extension", () => {
    const { images, attachments } = splitAnnouncementFiles([
      // Extensionless — Supabase storage keys often have none, which is exactly
      // why the split cannot look at the path.
      file({ url: "https://cdn.test/photo", type: "image/webp" }),
      file({ url: "https://cdn.test/doc", type: "application/pdf" }),
    ]);

    assert.deepEqual(
      images.map((entry) => entry.url),
      ["https://cdn.test/photo"],
    );
    assert.deepEqual(
      attachments.map((entry) => entry.url),
      ["https://cdn.test/doc"],
    );
  });

  it("treats an unknown or missing MIME type as an attachment", () => {
    const { images, attachments } = splitAnnouncementFiles([
      file({ type: "application/octet-stream" }),
      file({ type: null }),
    ]);

    assert.equal(images.length, 0);
    assert.equal(attachments.length, 2);
  });

  it("drops files whose url never resolved", () => {
    const { images, attachments } = splitAnnouncementFiles([
      file({ url: null }),
      file({ url: "https://cdn.test/ok.png" }),
    ]);

    assert.equal(images.length, 1);
    assert.equal(attachments.length, 0);
  });

  it("orders by displayOrder, treating null as 0", () => {
    const { images } = splitAnnouncementFiles([
      file({ url: "c", displayOrder: 3 }),
      file({ url: "a", displayOrder: null }),
      file({ url: "b", displayOrder: 1 }),
    ]);

    assert.deepEqual(
      images.map((entry) => entry.url),
      ["a", "b", "c"],
    );
  });
});

describe("describeAnnouncementError", () => {
  const mapped: [number, string][] = [
    [401, "Please sign in to view announcements."],
    [403, "You do not have access to announcements."],
    [404, "That announcement no longer exists."],
    [400, "That filter combination is not supported yet."],
  ];

  for (const [status, message] of mapped) {
    it(`maps ${status} to a specific message`, () => {
      assert.equal(
        describeAnnouncementError(new ApiError("raw", status, null)),
        message,
      );
    });
  }

  it("falls back to the status code for anything unmapped", () => {
    assert.match(
      describeAnnouncementError(new ApiError("raw", 500, null)),
      /500/,
    );
  });

  it("prefers a plain Error's own message", () => {
    assert.equal(describeAnnouncementError(new Error("boom")), "boom");
  });

  it("has a generic message for a non-error", () => {
    assert.match(describeAnnouncementError(undefined), /Something went wrong/);
  });
});
