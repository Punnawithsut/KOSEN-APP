"use client";

import * as React from "react";

import { ActionDialog } from "@/components/action-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useDeleteLoan, useUpdateLoan } from "@/hooks/use-loan";
import { useAvailableSlots } from "@/hooks/use-slot";
import { useToast } from "@/hooks/use-toast";
import type { LoanRecord } from "@/hooks/types/klongklongplus-types";

type LoanRequestManageDialogsProps = {
  editingLoan: LoanRecord | null;
  deletingLoan: LoanRecord | null;
  onCloseEdit: () => void;
  onCloseDelete: () => void;
};

function getBangkokDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function LoanRequestManageDialogs({
  editingLoan,
  deletingLoan,
  onCloseEdit,
  onCloseDelete,
}: LoanRequestManageDialogsProps) {
  const { toast } = useToast();
  const { trigger: deleteLoan, isMutating: isDeleting } = useDeleteLoan(
    deletingLoan?.id ?? "",
  );

  async function handleDeleteRequest() {
    if (!deletingLoan || deletingLoan.status !== "pending") return;
    try {
      await deleteLoan();
      toast({ title: "Request deleted", variant: "success" });
      onCloseDelete();
    } catch (error) {
      toast({
        title: "Unable to delete request",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  return (
    <>
      {editingLoan && (
        <EditLoanDialog
          key={editingLoan.id}
          loan={editingLoan}
          onClose={onCloseEdit}
        />
      )}

      <ActionDialog
        open={!!deletingLoan}
        onOpenChange={(open) => {
          if (!open) onCloseDelete();
        }}
        title="Delete request?"
        description={`This will remove your pending request for ${deletingLoan?.unit.code ?? "this unit"}. This action cannot be undone.`}
        actionLabel="Delete request"
        actionVariant="destructive"
        onCancel={onCloseDelete}
        onAction={handleDeleteRequest}
        isLoading={isDeleting}
        loadingLabel="Deleting…"
      >
        <p className="text-sm text-black-3">
          Are you sure you want to delete this pending request?
        </p>
      </ActionDialog>
    </>
  );
}

function EditLoanDialog({
  loan,
  onClose,
}: {
  loan: LoanRecord;
  onClose: () => void;
}) {
  const [editDate, setEditDate] = React.useState(loan.slotDate);
  const [editSlotId, setEditSlotId] = React.useState(loan.slotId);
  const { toast } = useToast();
  const {
    data: availableSlotsResponse,
    error: availableSlotsError,
    isLoading: areAvailableSlotsLoading,
  } = useAvailableSlots(loan.unitId, editDate, !!editDate, loan.id);
  const { trigger: updateLoan, isMutating: isUpdating } = useUpdateLoan(loan.id);
  const availableSlots = availableSlotsResponse?.data ?? [];
  const today = getBangkokDate();
  const minDate = loan.term.startDate > today ? loan.term.startDate : today;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loan.status !== "pending" || !editDate || !editSlotId) return;
    if (!availableSlots.some((slot) => slot.id === editSlotId)) {
      toast({
        title: "Choose an available time slot",
        description: "The selected slot is no longer available for this date.",
        variant: "error",
      });
      return;
    }

    try {
      await updateLoan({ slotDate: editDate, slotId: editSlotId });
      toast({ title: "Request updated", variant: "success" });
      onClose();
    } catch (error) {
      toast({
        title: "Unable to update request",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  return (
    <ActionDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Edit request ${loan.unit.code}`}
      description="Change the borrow date or choose another available time slot."
      actionLabel="Save changes"
      actionType="submit"
      actionForm="edit-loan-request-form"
      onCancel={onClose}
      isLoading={isUpdating}
      loadingLabel="Saving…"
      isActionDisabled={
        areAvailableSlotsLoading ||
        !!availableSlotsError ||
        !availableSlots.some((slot) => slot.id === editSlotId)
      }
    >
      <form id="edit-loan-request-form" onSubmit={handleSubmit}>
        {availableSlotsError && (
          <p
            role="alert"
            className="mb-5 rounded-md border border-negative-subtle bg-noti-negative-subtle px-3 py-2 text-sm text-negative-primary"
          >
            Unable to load available slots: {availableSlotsError.message}
          </p>
        )}

        <div className="space-y-5">
          <label className="block space-y-2 text-sm font-medium text-black-2">
            Borrow date
            <Input
              type="date"
              value={editDate}
              min={minDate}
              max={loan.term.endDate}
              onChange={(event) => {
                setEditDate(event.target.value);
                setEditSlotId("");
              }}
              disabled={isUpdating}
              required
            />
          </label>

          <label className="block space-y-2 text-sm font-medium text-black-2">
            Time slot
            <Select
              value={editSlotId}
              onChange={(event) => setEditSlotId(event.target.value)}
              disabled={
                !editDate ||
                areAvailableSlotsLoading ||
                availableSlots.length === 0 ||
                isUpdating
              }
              required
            >
              <option value="" disabled>
                {!editDate
                  ? "Select a date first"
                  : areAvailableSlotsLoading
                    ? "Loading available slots…"
                    : availableSlots.length === 0
                      ? "No available slots for this date"
                      : "Select a time slot"}
              </option>
              {availableSlots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.kind === "exam" ? "Exam" : "Normal"}:{" "}
                  {slot.startTime.slice(0, 5)}–{slot.endTime.slice(0, 5)}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </form>
    </ActionDialog>
  );
}
