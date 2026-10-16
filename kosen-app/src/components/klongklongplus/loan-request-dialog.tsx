"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAvailableSlots } from "@/hooks/use-slot";
import { useCreateLoan } from "@/hooks/use-loan";
import type { Unit } from "@/hooks/use-unit";
import { useCurrentTerm } from "@/hooks/use-term";
import { ApiError } from "@/lib/api/fetcher";

type LoanRequestDialogProps = {
  unit: Unit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function LoanRequestDialog({
  unit,
  open,
  onOpenChange,
}: LoanRequestDialogProps) {
  const [slotDate, setSlotDate] = useState("");
  const [slotId, setSlotId] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: termResponse, error: termError, isLoading: isTermLoading } =
    useCurrentTerm(open);
  const {
    data: slotsResponse,
    error: slotsError,
    isLoading: areSlotsLoading,
    mutate: refreshAvailableSlots,
  } = useAvailableSlots(
    unit?.id ?? null,
    slotDate,
    open && !!termResponse?.data,
  );
  const { trigger: createLoan, isMutating } = useCreateLoan();

  const term = termResponse?.data;
  const slots = slotsResponse?.data ?? [];
  const today = getBangkokDate();
  const minDate = term?.startDate && term.startDate > today
    ? term.startDate
    : today;
  const isLoadingBookingOptions = isTermLoading || (!!slotDate && areSlotsLoading);
  const bookingOptionsError = termError ?? slotsError;

  function handleOpenChange(nextOpen: boolean) {
    if (isMutating) return;
    if (!nextOpen) {
      setSlotDate("");
      setSlotId("");
      setSubmitError(null);
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!unit || !term || !slotDate || !slotId) return;

    try {
      await createLoan({
        unitId: unit.id,
        itemType: unit.itemType,
        termId: term.id,
        slotId,
        slotDate,
        returnNote: null,
      });
      setSlotDate("");
      setSlotId("");
      onOpenChange(false);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError && error.status === 409
          ? error.message
          : error instanceof ApiError && error.status >= 500
            ? "Unable to create the loan request right now. Please try again later."
          : error instanceof Error
            ? error.message
            : "Unable to submit your request.",
      );
      if (error instanceof ApiError && error.status === 409) {
        await refreshAvailableSlots();
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-orange-subtle-2 px-6 py-5">
          <DialogTitle className="pr-8 text-lg text-black-1">
            Request {unit?.code ?? "equipment"}
          </DialogTitle>
          <DialogDescription>
            Select a date and time slot for your equipment request.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            {bookingOptionsError && (
              <p
                role="alert"
                className="rounded-md border border-negative-subtle bg-noti-negative-subtle px-3 py-2 text-sm text-negative-primary"
              >
                Unable to load booking options: {bookingOptionsError.message}
              </p>
            )}

            {submitError && (
              <p
                role="alert"
                className="rounded-md border border-negative-subtle bg-noti-negative-subtle px-3 py-2 text-sm text-negative-primary"
              >
                {submitError}
              </p>
            )}

            {isLoadingBookingOptions && (
              <p className="text-sm text-black-3" role="status">
                Loading booking options…
              </p>
            )}

            <label className="block space-y-2 text-sm font-medium text-black-2">
              Borrow date
              <Input
                type="date"
                value={slotDate}
                min={minDate}
                max={term?.endDate}
                onChange={(event) => {
                  setSlotDate(event.target.value);
                  setSlotId("");
                  setSubmitError(null);
                }}
                disabled={!term || isTermLoading || isMutating}
                required
              />
              {term && (
                <span className="block text-xs font-normal text-black-4">
                  Current term: {term.name} ({term.startDate} – {term.endDate})
                </span>
              )}
            </label>

            <label className="block space-y-2 text-sm font-medium text-black-2">
              Time slot
              <Select
                value={slotId}
                onChange={(event) => setSlotId(event.target.value)}
                disabled={
                  !term ||
                  !slotDate ||
                  areSlotsLoading ||
                  slots.length === 0 ||
                  isMutating
                }
                required
              >
                <option value="" disabled>
                  {!slotDate
                    ? "Select a date first"
                    : areSlotsLoading
                    ? "Loading slots…"
                    : slots.length === 0
                      ? "No available slots for this date"
                      : "Select a time slot"}
                </option>
                {slots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.startTime.slice(0, 5)}–{slot.endTime.slice(0, 5)}
                  </option>
                ))}
              </Select>
            </label>
            {term &&
              !slotDate &&
              !isTermLoading &&
              !termError && (
                <p className="text-sm text-black-3">
                  Choose a date to see available time slots.
                </p>
              )}

            {!!slotDate &&
              !isLoadingBookingOptions &&
              !bookingOptionsError &&
              slots.length === 0 && (
                <p className="text-sm text-black-3">
                  No time slots are available for this date. Choose another date.
                </p>
              )}
          </div>

          <DialogFooter className="border-t border-orange-subtle-2 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isMutating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isMutating ||
                isLoadingBookingOptions ||
                !term ||
                !slotDate ||
                !slotId ||
                !!bookingOptionsError
              }
              className="bg-orange-secondary text-white hover:brightness-90"
            >
              {isMutating ? "Submitting…" : "Submit request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
