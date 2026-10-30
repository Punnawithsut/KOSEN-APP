"use client";

import { useState } from "react";

import { ActionDialog } from "@/components/action-dialog";
import { useToast } from "@/hooks/use-toast";

export function DeleteConfirmDialog({
  open,
  title,
  description,
  itemLabel,
  onCancel,
  onDelete,
}: {
  open: boolean;
  title: string;
  description: string;
  itemLabel: string;
  onCancel: () => void;
  onDelete: () => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);
    try {
      await onDelete();
      toast({ title: `${itemLabel} deleted`, variant: "success" });
      onCancel();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : `Could not delete ${itemLabel.toLowerCase()}.`;
      setError(message);
      toast({ title: `Could not delete ${itemLabel.toLowerCase()}`, description: message, variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <ActionDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isDeleting) onCancel();
      }}
      title={title}
      description={description}
      actionLabel={`Delete ${itemLabel.toLowerCase()}`}
      loadingLabel="Deleting…"
      actionVariant="destructive"
      isLoading={isDeleting}
      onCancel={onCancel}
      onAction={() => void handleDelete()}
    >
      {error ? <p role="alert" className="rounded-xl bg-noti-negative-subtle px-3 py-2 text-xs text-black-2">{error}</p> : null}
      <p className="text-sm text-black-3">This action cannot be undone.</p>
    </ActionDialog>
  );
}
