"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { ActionDialog } from "@/components/action-dialog";
import { AnnouncementPreviewDialog } from "@/components/announcement/announcement-preview-dialog";
import { Input } from "@/components/ui/input";
import {
  ALL_VALUE,
  DEPARTMENTS,
  TYPES,
  YEARS,
} from "@/lib/announcement/constants";
import type { Announcement } from "@/lib/announcement/types";

/** Mirrors the server's caps in `parseAnnouncementFormData`. */
const MAX_FILES = 10;
const MAX_BYTES = 50 * 1024 * 1024;

const SELECT_CLASS =
  "h-9 w-full rounded-xl border border-black-5 bg-white px-3 text-sm text-black-1 outline-none focus-visible:border-blue-primary focus-visible:ring-2 focus-visible:ring-blue-subtle-1";

const TEXTAREA_CLASS =
  "min-h-28 w-full rounded-xl border border-black-5 bg-white px-3 py-2 text-sm text-black-1 outline-none focus-visible:border-blue-primary focus-visible:ring-2 focus-visible:ring-blue-subtle-1";

/** `adv.` maps to year 6, which `parseYear` rejects — admins can't pick it. */
const SELECTABLE_YEARS = YEARS.filter((option) => option.enabled);

type AnnouncementFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired after the server accepts the write, so the list can refetch. */
  onSaved: () => void;
  /**
   * Present -> edit that announcement; omitted -> create a new one.
   *
   * In edit mode give this component a `key` of the announcement id so it
   * remounts per record. That is what lets the state below be initialised
   * straight from props instead of being synced in an effect.
   */
  announcement?: Announcement | null;
};

/**
 * Create/edit form for announcements, admins only.
 *
 * The request is `multipart/form-data`, so the `Content-Type` header is left
 * unset on purpose — the browser has to add it along with the multipart
 * boundary. Setting it by hand produces a body the server cannot parse.
 *
 * Edit mode leans on three server behaviours (see `parseAnnouncementFormData`
 * and `modifyAnnouncement`):
 *   - omitting `titleImage` keeps the existing banner;
 *   - omitting `files` and `clearFiles` keeps every existing attachment;
 *   - `clearFiles=true` wipes them all — there is no per-file delete.
 */
export function AnnouncementFormDialog({
  open,
  onOpenChange,
  onSaved,
  announcement = null,
}: AnnouncementFormDialogProps) {
  const editId = announcement?.id ?? null;
  const isEdit = editId !== null;
  const existingFileCount = announcement?.files.length ?? 0;

  const fieldId = useId();
  // The submit button lives in ActionDialog's footer, outside this <form>, so it
  // reaches the fields through the HTML `form` attribute.
  const formId = `${fieldId}-form`;
  const [name, setName] = useState(announcement?.name ?? "");
  const [description, setDescription] = useState(
    announcement?.description ?? "",
  );
  const [year, setYear] = useState<string>(
    announcement ? String(announcement.year) : ALL_VALUE,
  );
  const [department, setDepartment] = useState<string>(
    announcement?.department ?? ALL_VALUE,
  );
  const [type, setType] = useState<string>(announcement?.type ?? ALL_VALUE);
  const [titleImage, setTitleImage] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [clearFiles, setClearFiles] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Blob URLs for the preview live in a ref, so they are not part of the render
  // dependency graph. Only `previewSrc` — what to actually show — is state.
  const previewUrlsRef = useRef<string[]>([]);
  const [previewSrc, setPreviewSrc] = useState<{
    banner: string | null;
    files: string[];
  }>({ banner: null, files: [] });

  // Unmount only. At mount this list is still empty, so StrictMode's extra
  // cleanup pass revokes nothing instead of breaking a visible image.
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
    };
  }, []);

  function resetForm() {
    setName("");
    setDescription("");
    setYear(ALL_VALUE);
    setDepartment(ALL_VALUE);
    setType(ALL_VALUE);
    setTitleImage(null);
    setFiles([]);
    setClearFiles(false);
    closePreview();
    setError(null);
  }

  /**
   * Object URLs are minted and revoked from event handlers, never from an
   * effect. `reactStrictMode` double-invokes effects in dev, so an effect-based
   * version would revoke URLs that are still on screen.
   */
  function revokePreviewUrls() {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = [];
  }

  function openPreview() {
    // Drop any previous batch first: Cancel then Preview again would otherwise
    // leak one set of blob URLs per round trip.
    revokePreviewUrls();

    const banner = titleImage ? URL.createObjectURL(titleImage) : null;
    const urls = files.map((file) => URL.createObjectURL(file));
    previewUrlsRef.current = banner ? [banner, ...urls] : urls;
    setPreviewSrc({ banner, files: urls });
    setIsPreviewing(true);
  }

  function closePreview() {
    revokePreviewUrls();
    setPreviewSrc({ banner: null, files: [] });
    setIsPreviewing(false);
  }

  /**
   * ActionDialog's Cancel button only calls `onCancel` — it never closes on its
   * own — so closing has to happen here. The same handler runs when the dialog
   * is dismissed with Escape, the overlay, or the close button, where the
   * follow-up `onOpenChange(false)` is just a harmless repeat.
   */
  function handleCancel() {
    setError(null);
    closePreview();
    onOpenChange(false);
  }

  /**
   * The footer button no longer writes anything — it validates and switches to
   * the preview, which is where publishing happens. Keeping this as the form's
   * submit handler is what still gets the browser's own `required` checks.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Mirror the server's limits locally so the problem surfaces before the
    // preview rather than as a 400 after publishing.
    if (files.length > MAX_FILES) {
      setError(`At most ${MAX_FILES} files are allowed.`);
      return;
    }
    const oversized = [titleImage, ...files].find(
      (file) => file && file.size > MAX_BYTES,
    );
    if (oversized) {
      setError(`${oversized.name} is larger than 50 MiB.`);
      return;
    }

    openPreview();
  }

  /** The only write in this component, and it only runs from the preview. */
  async function publish() {
    setError(null);

    const body = new FormData();
    body.set("name", name.trim());
    body.set("description", description.trim());
    body.set("year", year);
    body.set("department", department);
    body.set("type", type);
    if (titleImage) body.set("titleImage", titleImage);
    for (const file of files) body.append("files", file);
    // Only meaningful on its own: with new files attached, `replaceFiles` is
    // already true and the new set wins anyway.
    if (isEdit && clearFiles && files.length === 0) {
      body.set("clearFiles", "true");
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        isEdit ? `/api/announcement/${editId}` : "/api/announcement",
        {
          method: isEdit ? "PUT" : "POST",
          body,
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        reason?: string;
        error?: string;
      } | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload?.reason ??
            payload?.error ??
            `Request failed (${response.status})`,
        );
      }

      resetForm();
      onOpenChange(false);
      onSaved();
    } catch (submitError) {
      // Stay in the preview on failure, so a rejected publish does not cost the
      // admin the text they typed or the files they picked.
      setError(
        submitError instanceof Error
          ? submitError.message
          : `Could not ${isEdit ? "update" : "create"} the announcement.`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  // A ternary rather than a fragment wrapping both overlays: the form keeps its
  // own `<ActionDialog>` at the same nesting depth, so nothing below needs
  // re-indenting, and only one overlay is ever mounted.
  return isPreviewing ? (
    <AnnouncementPreviewDialog
      name={name.trim()}
      description={description.trim()}
      bannerUrl={previewSrc.banner}
      currentTitleImageUrl={announcement?.titleImageUrl ?? null}
      files={files}
      fileUrls={previewSrc.files}
      currentFiles={announcement?.files ?? []}
      replacesAttachments={files.length > 0 || clearFiles}
      isPublishing={submitting}
      error={error}
      onCancel={() => {
        // Back to the form with everything still typed in, minus the publish
        // error the preview was showing.
        setError(null);
        closePreview();
      }}
      onPublish={() => {
        void publish();
      }}
    />
  ) : (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit announcement" : "New announcement"}
      description="Leave a dropdown on “all” to target everyone."
      actionLabel="Preview"
      actionType="submit"
      actionForm={formId}
      isActionDisabled={!name.trim() || !description.trim()}
      onCancel={handleCancel}
    >
      {/* ActionDialog's content box is `overflow-hidden` with no height cap, so a
          form this tall would be centred and clipped past both viewport edges.
          Capping the scroll container to 60vh keeps the footer in reach. */}
      <div className="max-h-[60vh] overflow-y-auto pr-1">
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-noti-negative-subtle px-3 py-2 text-xs text-black-2"
            >
              {error}
            </p>
          ) : null}

          <div>
            <label
              htmlFor={`${fieldId}-name`}
              className="mb-1 block text-xs font-medium text-black-2"
            >
              Title
            </label>
            <Input
              id={`${fieldId}-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={200}
            />
          </div>

          <div>
            <label
              htmlFor={`${fieldId}-description`}
              className="mb-1 block text-xs font-medium text-black-2"
            >
              Description
            </label>
            <textarea
              id={`${fieldId}-description`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              className={TEXTAREA_CLASS}
            />
          </div>

          {/* ActionDialog is a narrow `max-w-md` shell, so three columns would
              squeeze "Mechatronics" into ~125px. Two columns plus a full-width
              Type row instead. */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`${fieldId}-year`}
                className="mb-1 block text-xs font-medium text-black-2"
              >
                Year
              </label>
              <select
                id={`${fieldId}-year`}
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className={SELECT_CLASS}
              >
                <option value={ALL_VALUE}>all</option>
                {SELECTABLE_YEARS.map((option) => (
                  <option key={option.value} value={String(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor={`${fieldId}-department`}
                className="mb-1 block text-xs font-medium text-black-2"
              >
                Department
              </label>
              <select
                id={`${fieldId}-department`}
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className={SELECT_CLASS}
              >
                <option value={ALL_VALUE}>all</option>
                {DEPARTMENTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor={`${fieldId}-type`}
                className="mb-1 block text-xs font-medium text-black-2"
              >
                Type
              </label>
              <select
                id={`${fieldId}-type`}
                value={type}
                onChange={(event) => setType(event.target.value)}
                className={SELECT_CLASS}
              >
                <option value={ALL_VALUE}>all</option>
                {TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor={`${fieldId}-title-image`}
              className="mb-1 block text-xs font-medium text-black-2"
            >
              {isEdit ? "Replace title image" : "Title image"}
            </label>
            <input
              id={`${fieldId}-title-image`}
              type="file"
              accept="image/*"
              onChange={(event) =>
                setTitleImage(event.target.files?.[0] ?? null)
              }
              className="block w-full text-xs text-black-3 file:mr-3 file:rounded-full file:border-0 file:bg-orange-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
            />
            <p className="mt-1 text-[11px] text-black-4">
              Shown as the card thumbnail and the detail banner.
              {isEdit ? " Leave empty to keep the current one." : ""}
            </p>
            {titleImage ? (
              <p className="mt-1 truncate text-[11px] font-medium text-orange-secondary">
                Picked: {titleImage.name}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={`${fieldId}-files`}
              className="mb-1 block text-xs font-medium text-black-2"
            >
              {isEdit && existingFileCount > 0
                ? `Replace attachments (${existingFileCount} now)`
                : `Attachments (up to ${MAX_FILES})`}
            </label>
            <input
              id={`${fieldId}-files`}
              type="file"
              multiple
              onChange={(event) =>
                setFiles(Array.from(event.target.files ?? []))
              }
              className="block w-full text-xs text-black-3 file:mr-3 file:rounded-full file:border-0 file:bg-blue-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
            />
            <p className="mt-1 text-[11px] text-black-4">
              Images appear in the detail gallery; anything else becomes a
              downloadable chip.
              {isEdit && existingFileCount > 0
                ? " Choosing any replaces them all."
                : ""}
            </p>

            {/* The preview unmounts this form, and a file input cannot be
                repopulated from state — it only ever shows what the user
                physically selected. Without this line, coming back from the
                preview looks like the picked files were thrown away. */}
            {files.length > 0 ? (
              <p className="mt-1 line-clamp-2 text-[11px] font-medium text-orange-secondary">
                Picked: {files.map((file) => file.name).join(", ")}
              </p>
            ) : null}

            {isEdit && existingFileCount > 0 ? (
              <label className="mt-2 flex items-center gap-2 text-[11px] text-black-3">
                <input
                  type="checkbox"
                  checked={clearFiles}
                  disabled={files.length > 0}
                  onChange={(event) => setClearFiles(event.target.checked)}
                  className="size-3.5 accent-orange-secondary disabled:opacity-50"
                />
                Remove all {existingFileCount} current attachments
              </label>
            ) : null}
          </div>
        </form>
      </div>
    </ActionDialog>
  );
}
