"use client";

import { useEffect } from "react";

import { AnnouncementDetailView } from "@/components/announcement/announcement-detail-view";
import { Button } from "@/components/ui/button";
import {
  splitAnnouncementFiles,
  type AnnouncementFile,
  type ResolvedAnnouncementFile,
} from "@/lib/announcement/types";

type AnnouncementPreviewDialogProps = {
  name: string;
  description: string;
  /** Object URL for a banner picked in this session, if any. */
  bannerUrl: string | null;
  /** Banner already stored, used when nothing new was picked. */
  currentTitleImageUrl: string | null;
  /** Files picked in this session, with `fileUrls` parallel by index. */
  files: File[];
  fileUrls: string[];
  /** Files already stored. */
  currentFiles: AnnouncementFile[];
  /** Mirrors the server's `replaceFiles`: new files, or an explicit clear. */
  replacesAttachments: boolean;
  isPublishing: boolean;
  error: string | null;
  onCancel: () => void;
  onPublish: () => void;
};

const NO_ATTACHMENTS: {
  images: ResolvedAnnouncementFile[];
  attachments: ResolvedAnnouncementFile[];
} = { images: [], attachments: [] };

/**
 * Full-screen preview of an unsaved announcement, shown between the form and
 * the write.
 *
 * It resolves the pending state the way `modifyAnnouncement` will — a new
 * banner wins over the stored one, new files win over stored ones, an explicit
 * clear wins over both — so what the admin approves is what the server is about
 * to do.
 *
 * Held deliberately hook-free: the object URLs for locally picked files are
 * minted and revoked by the caller, because `reactStrictMode` double-invokes
 * effects in dev and an effect-based version would revoke URLs still on screen.
 */
export function AnnouncementPreviewDialog({
  name,
  description,
  bannerUrl,
  currentTitleImageUrl,
  files,
  fileUrls,
  currentFiles,
  replacesAttachments,
  isPublishing,
  error,
  onCancel,
  onPublish,
}: AnnouncementPreviewDialogProps) {
  /**
   * Hold the page behind the preview still.
   *
   * The form's `ActionDialog` used to own this — Radix locks body scroll while
   * a dialog is open. The preview replaces that dialog, so without this the
   * background becomes scrollable the instant Preview is pressed and its
   * scrollbar reappears underneath.
   *
   * React runs a removed subtree's effect cleanups before the replacement's
   * effects, so Radix restoring the old `overflow` cannot clobber this.
   */
  useEffect(() => {
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const staged: ResolvedAnnouncementFile[] = files.flatMap((file, index) => {
    const url = fileUrls[index];
    if (!url) return [];
    return [{ url, type: file.type || null, displayOrder: index }];
  });

  const stagedSplit = splitAnnouncementFiles(staged);
  const storedSplit = replacesAttachments
    ? NO_ATTACHMENTS
    : splitAnnouncementFiles(currentFiles);

  // Staged files win whenever there are any; otherwise the stored set stands,
  // minus everything if this is a clear.
  const images = files.length > 0 ? stagedSplit.images : storedSplit.images;
  const attachments =
    files.length > 0 ? stagedSplit.attachments : storedSplit.attachments;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Preview announcement"
      className="fixed inset-0 z-[60] flex flex-col overflow-y-auto overscroll-contain bg-background"
    >
      <div className="w-full flex-1 px-4 pt-4 md:px-6">
        <div className="mx-auto w-full max-w-[430px] md:max-w-3xl">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-black-1">Preview</h2>
            <p className="text-[11px] text-black-4">
              Nothing is saved until you publish.
            </p>
          </div>

          <AnnouncementDetailView
            name={name}
            description={description}
            titleImageUrl={bannerUrl ?? currentTitleImageUrl}
            images={images}
            attachments={attachments}
          />
        </div>
      </div>

      {/* Sticky so the two decisions stay reachable however long the body is.
          `flex-1` above pushes this to the bottom when the content is short, so
          it never floats mid-screen.
          Styled to match the navbar: same cream `bg-bg-primary`, same orange
          hairline, and the same safe-area padding the mobile tab bar uses —
          on a phone this bar sits exactly where that one does. */}
      <div
        className="sticky bottom-0 border-t border-orange-subtle-2 bg-bg-primary"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="mx-auto flex w-full max-w-[430px] flex-col gap-2 px-4 py-3 md:max-w-3xl md:flex-row md:items-center md:justify-end md:px-6">
          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-noti-negative-subtle px-3 py-2 text-xs text-black-2 md:mr-auto"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPublishing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onPublish}
            disabled={isPublishing}
            className="bg-orange-secondary text-white hover:brightness-90"
          >
            {isPublishing ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
}
