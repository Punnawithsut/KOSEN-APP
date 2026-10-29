"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ActionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  cancelLabel?: string;
  actionLabel: string;
  onCancel: () => void;
  onAction?: () => void;
  actionType?: "button" | "submit";
  actionForm?: string;
  actionVariant?: "default" | "destructive";
  isLoading?: boolean;
  loadingLabel?: string;
  isActionDisabled?: boolean;
  /** Extra classes for the dialog panel, e.g. a wider `sm:max-w-2xl`. */
  contentClassName?: string;
};

export function ActionDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  cancelLabel = "Cancel",
  actionLabel,
  onCancel,
  onAction,
  actionType = "button",
  actionForm,
  actionVariant = "default",
  isLoading = false,
  loadingLabel = "Please wait…",
  isActionDisabled = false,
  contentClassName,
}: ActionDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isLoading) return;
        if (!nextOpen) onCancel();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className={cn("max-w-md gap-0 overflow-hidden p-0", contentClassName)}
      >
        <DialogHeader className="border-b border-orange-subtle-2 px-6 py-5">
          <DialogTitle className="pr-8 text-lg text-black-1">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto px-6 py-6">
          {children}
        </div>

        <DialogFooter className="border-t border-orange-subtle-2 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type={actionType}
            form={actionForm}
            variant={actionVariant}
            onClick={onAction}
            disabled={isLoading || isActionDisabled}
            className={
              actionVariant === "default"
                ? "bg-orange-secondary text-white hover:brightness-90"
                : undefined
            }
          >
            {isLoading ? loadingLabel : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
