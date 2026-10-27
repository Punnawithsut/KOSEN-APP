"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LoanAgreementAcknowledgementsProps = {
  borrowingRulesAccepted: boolean;
  responsibilityAgreementAccepted: boolean;
  disabled?: boolean;
  onBorrowingRulesChange: (accepted: boolean) => void;
  onResponsibilityAgreementChange: (accepted: boolean) => void;
};

type Agreement = "borrowing-rules" | "responsibility";

export function LoanAgreementAcknowledgements({
  borrowingRulesAccepted,
  responsibilityAgreementAccepted,
  disabled = false,
  onBorrowingRulesChange,
  onResponsibilityAgreementChange,
}: LoanAgreementAcknowledgementsProps) {
  const [openAgreement, setOpenAgreement] = React.useState<Agreement | null>(
    null,
  );
  const isBorrowingRules = openAgreement === "borrowing-rules";

  return (
    <>
      <fieldset className="space-y-4 border-t border-orange-subtle-2 pt-5">
        <legend className="mb-3 text-sm font-semibold text-black-2">
          Please read and acknowledge
        </legend>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-start gap-3 text-sm text-black-2">
              <input
                type="checkbox"
                checked={borrowingRulesAccepted}
                onChange={(event) =>
                  onBorrowingRulesChange(event.target.checked)
                }
                disabled={disabled}
                required
                className="mt-0.5 size-4 shrink-0 accent-orange-secondary disabled:opacity-50"
              />
              <span>I understand the borrowing and return rules.</span>
            </label>
            <Button
              type="button"
              variant="link"
              onClick={() => setOpenAgreement("borrowing-rules")}
              className="ml-7 h-auto p-0 text-sm text-orange-secondary underline underline-offset-2"
            >
              Read borrowing and return rules
            </Button>
          </div>

          <div className="space-y-2">
            <label className="flex items-start gap-3 text-sm text-black-2">
              <input
                type="checkbox"
                checked={responsibilityAgreementAccepted}
                onChange={(event) =>
                  onResponsibilityAgreementChange(event.target.checked)
                }
                disabled={disabled}
                required
                className="mt-0.5 size-4 shrink-0 accent-orange-secondary disabled:opacity-50"
              />
              <span>
                I have read and agree to the equipment responsibility agreement.
              </span>
            </label>
            <Button
              type="button"
              variant="link"
              onClick={() => setOpenAgreement("responsibility")}
              className="ml-7 h-auto p-0 text-sm text-orange-secondary underline underline-offset-2"
            >
              Read equipment responsibility agreement
            </Button>
          </div>
        </div>
      </fieldset>

      <Dialog
        open={openAgreement !== null}
        onOpenChange={(open) => {
          if (!open) setOpenAgreement(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[85vh] max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-2xl"
        >
          <DialogHeader className="border-b border-orange-subtle-2 px-6 py-5">
            <DialogTitle className="text-lg text-black-1">
              {isBorrowingRules
                ? "Collection and return of calculators and charging cables"
                : "Agreement on responsibility for damage, loss, and equipment return"}
            </DialogTitle>
            <DialogDescription>
              Please read the terms carefully before acknowledging them.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 space-y-5 overflow-y-auto px-6 py-5 text-sm leading-6 text-black-2">
            {isBorrowingRules ? (
              <>
                <section className="space-y-2">
                  <h3 className="font-semibold text-black-1">
                    1. Borrowing method
                  </h3>
                  <div className="space-y-2 pl-4">
                    <p>
                      <strong>Normal periods:</strong> The periods are
                      08:15–09:55, 10:05–11:45, 12:40–14:20, and 14:30–16:10.
                      Submit the borrowing notification form at least 5 minutes
                      before your selected start time. Club staff will deliver
                      the equipment at least 5 minutes before that time.
                    </p>
                    <p>
                      <strong>Exam periods:</strong> The periods are
                      08:30–10:00, 11:00–12:30, and 14:00–15:30. Notify staff at
                      least 10 minutes before your selected start time. Staff
                      will deliver the equipment at least 10 minutes before that
                      time.
                    </p>
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-black-1">
                    2. Return method
                  </h3>
                  <p className="pl-4">
                    Return the item to the staff member who delivered it, at the
                    designated receiving location, within 5 minutes of the end
                    of your borrowing period.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-black-1">
                    3. Limits and late returns
                  </h3>
                  <p className="pl-4">
                    Each person may have a maximum of 3 approved equipment
                    loans per term. Pending requests temporarily reserve an
                    available use; rejected requests free that use. Once
                    approved, a loan counts even if it is later cancelled or
                    marked as a no-show. Returning an item after the specified
                    time may result in the loss of borrowing privileges for
                    your next request.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-black-1">
                    4. Equipment care
                  </h3>
                  <p className="pl-4">
                    Handle and maintain the equipment carefully so it remains in
                    good condition and ready for others to use.
                  </p>
                </section>
              </>
            ) : (
              <>
                <section className="space-y-2">
                  <h3 className="font-semibold text-black-1">
                    1. Equipment care
                  </h3>
                  <p className="pl-4">
                    I agree to use the equipment carefully, only for its
                    intended purpose and in the proper manner, and to keep it
                    safe throughout the borrowing period.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-black-1">
                    2. Lost equipment
                  </h3>
                  <p className="pl-4">
                    If equipment is lost while it is in my care or under my
                    responsibility, I agree to take appropriate responsibility
                    based on its value or the cost of obtaining a replacement.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-black-1">
                    3. Damage or malfunction
                  </h3>
                  <div className="space-y-2 pl-4">
                    <p>If equipment is damaged or broken due to:</p>
                    <ul className="list-disc space-y-1 pl-6">
                      <li>
                        <strong className="font-semibold">Negligent use</strong>
                      </li>
                      <li>
                        <strong className="font-semibold">
                          Improper use or misuse
                        </strong>
                      </li>
                      <li>
                        <strong className="font-semibold">
                          Unauthorized modification, alteration, or repair
                        </strong>
                      </li>
                      <li>
                        <strong className="font-semibold">
                          Failure to follow instructions or operating
                          regulations
                        </strong>
                      </li>
                      <li>
                        <strong className="font-semibold">
                          My actions or omissions
                        </strong>
                      </li>
                    </ul>
                    <p>
                      I agree to take appropriate responsibility for repair or
                      replacement costs based on the actual damage.
                    </p>
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-black-1">
                    4. Normal wear and tear
                  </h3>
                  <p className="pl-4">
                    I will not be responsible for deterioration due to the
                    equipment&apos;s age or damage resulting from normal, proper
                    use. The project administrator will inspect and evaluate the
                    equipment based on the facts.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-black-1">
                    5. Equipment inspection
                  </h3>
                  <p className="pl-4">
                    I consent to the project administrator inspecting the
                    equipment before delivery and upon return to record its
                    condition and check for damage. If damage is found, the
                    administrator will notify me of the details and related
                    expenses before proceeding with collection or other actions
                    under the project rules.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-black-1">
                    6. Confirmation and acceptance
                  </h3>
                  <p className="pl-4">
                    I certify that the information I provided in the form is
                    true and confirm that I have read, understood, and accepted
                    this equipment borrowing and return agreement, including the
                    responsibilities for loss and damage described above.
                  </p>
                </section>
              </>
            )}
          </div>

          <DialogFooter className="border-t border-orange-subtle-2 px-6 py-4">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenAgreement(null)}
              >
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
