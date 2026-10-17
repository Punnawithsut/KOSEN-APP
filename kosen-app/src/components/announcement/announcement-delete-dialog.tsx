"use client";

import { useState } from "react";

import { ActionDialog } from "@/components/action-dialog";
import { apiErrorFromResponse } from "@/lib/api/fetcher";
import type { Announcement } from "@/lib/announcement/types";

type AnnouncementDeleteDialogProps = {
  /** The announcement to delete, or `null` to keep the dialog closed. */
  announcement: Announcement | null;
  onOpenChange: (open: boolean) => void;
  /** Fired after the server confirms the delete, so the list can refetch. */
  onDeleted: () => void;
};

/**
 * Confirmation for `DELETE /api/announcement/[id]`.
 *
 * The delete is a soft delete server-side (`softDeleteAnnouncementById`), so the
 * copy deliberately avoids promising anything is destroyed — what the user sees
 * is that it stops being listed.
 */
export function AnnouncementDeleteDialog({
  announcement,
  onOpenChange,
  onDeleted,
}: AnnouncementDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setError(null);
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!announcement) return;

    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/announcement/${announcement.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // `apiErrorFromResponse` reads the API's own `error` field, so the
        // server's message survives instead of being replaced by a status code.
        throw await apiErrorFromResponse(response);
      }

      onOpenChange(false);
      onDeleted();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the announcement.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <ActionDialog
      open={announcement !== null}
      onOpenChange={onOpenChange}
      title="Delete announcement?"
      description="It stops appearing in the list for everyone."
      actionLabel="Delete"
      loadingLabel="Deleting…"
      actionVariant="destructive"
      isLoading={isDeleting}
      onCancel={handleClose}
      onAction={() => {
        void handleDelete();
      }}
    >
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-noti-negative-subtle px-3 py-2 text-xs text-black-2"
        >
          {error}
        </p>
      ) : null}

      <p className="text-sm text-black-3">
        {announcement
          ? `“${announcement.name}” will no longer be listed.`
          : null}
      </p>
    </ActionDialog>
  );
}
