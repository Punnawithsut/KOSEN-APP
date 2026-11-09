"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  SendNotificationButton,
  type NotificationDraft,
  type SendNotificationHandle,
} from "@/components/send-notification-button";
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
import { LoanAgreementAcknowledgements } from "@/components/klongklongplus/loan-agreement-acknowledgements";
import { useAvailableSlots } from "@/hooks/use-slot";
import { useCreateLoan } from "@/hooks/use-loan";
import type { Unit } from "@/hooks/use-unit";
import { useCurrentTerm } from "@/hooks/use-term";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api/fetcher";

const EMPTY_NOTIFICATION_DRAFT: NotificationDraft = {
  enabled: false,
  autoFill: true,
  title: "",
  body: "",
};

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
  const [borrowingRulesAccepted, setBorrowingRulesAccepted] = useState(false);
  const [responsibilityAgreementAccepted, setResponsibilityAgreementAccepted] =
    useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [notificationDraft, setNotificationDraft] =
    useState<NotificationDraft>(EMPTY_NOTIFICATION_DRAFT);
  const notificationRef = useRef<SendNotificationHandle>(null);
  const {
    data: termResponse,
    error: termError,
    isLoading: isTermLoading,
  } = useCurrentTerm(open);
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
  const { toast } = useToast();

  const term = termResponse?.data;
  const slots = slotsResponse?.data ?? [];
  const selectedSlot = slots.find((slot) => slot.id === slotId);
  const today = getBangkokDate();
  const minDate =
    term?.startDate && term.startDate > today ? term.startDate : today;
  const isLoadingBookingOptions =
    isTermLoading || (!!slotDate && areSlotsLoading);
  const bookingOptionsError = termError ?? slotsError;

  useEffect(() => {
    if (bookingOptionsError) {
      toast({
        title: "Unable to load booking options",
        description: bookingOptionsError.message,
        variant: "error",
      });
    }
  }, [bookingOptionsError, toast]);

  function handleOpenChange(nextOpen: boolean) {
    if (isMutating || isSendingNotification) return;
    if (!nextOpen) {
      setSlotDate("");
      setSlotId("");
      setBorrowingRulesAccepted(false);
      setResponsibilityAgreementAccepted(false);
      setSubmitError(null);
      setNotificationDraft(EMPTY_NOTIFICATION_DRAFT);
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (
      !unit ||
      !term ||
      !slotDate ||
      !slotId ||
      !borrowingRulesAccepted ||
      !responsibilityAgreementAccepted
    )
      return;

    try {
      const createdLoan = await createLoan({
        unitId: unit.id,
        itemType: unit.itemType,
        termId: term.id,
        slotId,
        slotDate,
        returnNote: null,
      });
      let notificationResult:
        | Awaited<ReturnType<SendNotificationHandle["sendIfEnabled"]>>
        | undefined;
      let notificationError: string | undefined;
      if (notificationDraft.enabled) {
        setIsSendingNotification(true);
        try {
          notificationResult =
            await notificationRef.current?.sendIfEnabled(undefined, {
              loanId: createdLoan.data.id,
            });
          if (!notificationResult) {
            notificationError = "Unable to notify admins.";
          }
        } catch (error) {
          notificationError =
            error instanceof Error ? error.message : "Unable to notify admins.";
        } finally {
          setIsSendingNotification(false);
        }
      }
      setSlotDate("");
      setSlotId("");
      setBorrowingRulesAccepted(false);
      setResponsibilityAgreementAccepted(false);
      setNotificationDraft(EMPTY_NOTIFICATION_DRAFT);
      onOpenChange(false);
      if (notificationError || notificationResult?.error) {
        toast({
          title: "Loan request submitted; admins were not fully notified",
          description:
            notificationError ??
            notificationResult?.error ??
            "Please try again.",
          variant: "error",
        });
      } else {
        toast({
          title: "Loan request submitted",
          description:
            notificationResult && !notificationResult.skipped
              ? `Admins notified (${notificationResult.sentCount}).`
              : undefined,
          variant: "success",
        });
      }
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 409
          ? error.message
          : error instanceof ApiError && error.status >= 500
            ? "Unable to create the loan request right now. Please try again later."
            : error instanceof Error
              ? error.message
              : "Unable to submit your request.";
      setSubmitError(message);
      toast({
        title: "Unable to submit request",
        description: message,
        variant: "error",
      });
      if (error instanceof ApiError && error.status === 409) {
        await refreshAvailableSlots();
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-orange-subtle-2 px-6 py-5">
          <DialogTitle className="pr-8 text-lg text-black-1">
            Request {unit?.code ?? "equipment"}
          </DialogTitle>
          <DialogDescription>
            Select a date and time slot for your equipment request.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-col overflow-hidden"
          onSubmit={handleSubmit}
        >
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
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
                className="date-input"
                value={slotDate}
                min={minDate}
                max={term?.endDate}
                onChange={(event) => {
                  setSlotDate(event.target.value);
                  setSlotId("");
                  setSubmitError(null);
                }}
                disabled={
                  !term || isTermLoading || isMutating || isSendingNotification
                }
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
                  isMutating ||
                  isSendingNotification
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
                    {slot.kind === "exam" ? "Exam" : "Normal"}:{" "}
                    {slot.startTime.slice(0, 5)}–{slot.endTime.slice(0, 5)}
                  </option>
                ))}
              </Select>
            </label>
            {term && !slotDate && !isTermLoading && !termError && (
              <p className="text-sm text-black-3">
                Choose a date to see available time slots.
              </p>
            )}

            {!!slotDate &&
              !isLoadingBookingOptions &&
              !bookingOptionsError &&
              slots.length === 0 && (
                <p className="text-sm text-black-3">
                  No time slots are available for this date. Choose another
                  date.
                </p>
              )}

            <LoanAgreementAcknowledgements
              borrowingRulesAccepted={borrowingRulesAccepted}
              responsibilityAgreementAccepted={responsibilityAgreementAccepted}
              disabled={isMutating || isSendingNotification}
              onBorrowingRulesChange={setBorrowingRulesAccepted}
              onResponsibilityAgreementChange={
                setResponsibilityAgreementAccepted
              }
            />
            <SendNotificationButton
              ref={notificationRef}
              isUseInModal
              notifyAdmins
              inModalText="Notify admins about this loan request"
              notificationTitle={`New loan request: ${unit?.code ?? "equipment"}`}
              notificationBody={`A loan request for ${unit?.code ?? "equipment"} on ${slotDate || "the selected date"}${selectedSlot ? ` at ${selectedSlot.startTime.slice(0, 5)}` : ""} is awaiting review.`}
              draft={notificationDraft}
              onDraftChange={setNotificationDraft}
            />
          </div>

          <DialogFooter className="border-t border-orange-subtle-2 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isMutating || isSendingNotification}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isMutating ||
                isSendingNotification ||
                isLoadingBookingOptions ||
                !term ||
                !slotDate ||
                !slotId ||
                !borrowingRulesAccepted ||
                !responsibilityAgreementAccepted ||
                !!bookingOptionsError
              }
              className="bg-orange-secondary text-white hover:brightness-90"
            >
              {isMutating || isSendingNotification
                ? "Submitting…"
                : "Submit request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
