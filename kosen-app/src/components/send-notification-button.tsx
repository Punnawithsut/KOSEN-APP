"use client";

import {
  forwardRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import { Bell, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const DEPARTMENTS = [
  "Computer Engineering",
  "Mechatronics Engineering",
  "Electrical and Electronics Engineering",
] as const;
const YEARS = [1, 2, 3, 4, 5] as const;
const DORM_BUILDINGS = ["7", "8"] as const;
const SEND_BATCH_SIZE = 100;

// Codes returned by `/api/notifications/send`. "No device subscribed" is a
// different problem from "the push service rejected it", so they must not be
// collapsed into one message.
const FAILURE_LABELS: Record<string, string> = {
  no_subscription: "no subscribed device",
  missing_vapid_keys: "push not configured on the server",
  delivery_failed: "delivery error",
};

function describePartialFailure(reasons: string[]): string {
  const counts = new Map<string, number>();
  for (const reason of reasons) {
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }

  const parts = [...counts.entries()].map(
    ([reason, count]) => `${count} with ${FAILURE_LABELS[reason] ?? reason}`,
  );

  return parts.length > 0 ? ` (${parts.join(", ")})` : "";
}
const FIELD_CLASS =
  "w-full rounded-xl border border-black-5 bg-white px-3 py-2 text-sm text-black-1 outline-none transition focus-visible:border-blue-primary focus-visible:ring-2 focus-visible:ring-blue-subtle-1 disabled:opacity-60";

type Recipient = {
  userId: string;
  studentId: string | null;
};

type RecipientFilters = {
  department: string;
  year: string;
  dormBuilding: string;
  dormRoom: string;
};

export type NotificationSendResult = {
  skipped: boolean;
  sentCount: number;
  failedCount: number;
  error?: string;
};

export type SendNotificationHandle = {
  isEnabled: () => boolean;
  sendIfEnabled: (targetUserIds?: string[]) => Promise<NotificationSendResult>;
};

export type NotificationDraft = {
  enabled: boolean;
  autoFill: boolean;
  title: string;
  body: string;
};

type SendNotificationProps = {
  isUseInModal: boolean;
  inModalText?: string;
  notificationTitle: string;
  notificationBody: string;
  targetUserIds?: string[];
  draft?: NotificationDraft;
  onDraftChange?: (draft: NotificationDraft) => void;
};

export const SendNotificationButton = forwardRef<
  SendNotificationHandle,
  SendNotificationProps
>(function SendNotificationButton(
  {
    isUseInModal,
    inModalText,
    notificationTitle,
    notificationBody,
    targetUserIds = [],
    draft: controlledDraft,
    onDraftChange,
  },
  ref,
) {
  const { toast } = useToast();
  const [internalDraft, setInternalDraft] = useState<NotificationDraft>({
    enabled: false,
    autoFill: false,
    title: "",
    body: "",
  });
  const draft = controlledDraft ?? internalDraft;
  const { enabled: isEnabled, autoFill } = draft;
  const title = autoFill ? notificationTitle : draft.title;
  const body = autoFill ? notificationBody : draft.body;
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [filters, setFilters] = useState<RecipientFilters>({
    department: "",
    year: "",
    dormBuilding: "",
    dormRoom: "",
  });
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[] | null>(null);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [recipientError, setRecipientError] = useState<string | null>(null);

  function updateDraft(changes: Partial<NotificationDraft>) {
    const nextDraft = { ...draft, ...changes };
    if (onDraftChange) onDraftChange(nextDraft);
    else setInternalDraft(nextDraft);
  }

  useEffect(() => {
    if (isUseInModal) return;

    const controller = new AbortController();
    const params = new URLSearchParams();
    if (filters.department) params.set("department", filters.department);
    if (filters.year) params.set("year", filters.year);
    if (filters.dormBuilding) params.set("dormBuilding", filters.dormBuilding);
    if (filters.dormRoom.trim())
      params.set("dormRoom", filters.dormRoom.trim());

    setIsLoadingRecipients(true);
    setRecipientError(null);

    void fetch(`/api/user${params.size ? `?${params.toString()}` : ""}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as {
          ok?: boolean;
          data?: Recipient[];
          error?: string;
        };
        if (!response.ok || !result.ok || !Array.isArray(result.data)) {
          throw new Error(result.error ?? "Unable to load recipient list.");
        }
        setRecipients(result.data);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setRecipients([]);
        setRecipientError(
          error instanceof Error
            ? error.message
            : "Unable to load recipient list.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingRecipients(false);
      });

    return () => controller.abort();
  }, [filters, isUseInModal]);

  const sendToUsers = useCallback(
    async (userIds: string[]): Promise<NotificationSendResult> => {
      const uniqueIds = [...new Set(userIds)];
      if (uniqueIds.length === 0) {
        return {
          skipped: false,
          sentCount: 0,
          failedCount: 0,
          error: "No recipients match the selected filters.",
        };
      }
      if (!title.trim() || !body.trim()) {
        return {
          skipped: false,
          sentCount: 0,
          failedCount: uniqueIds.length,
          error: "Enter both a notification title and body.",
        };
      }

      setIsSending(true);
      setSendError(null);
      let sentCount = 0;
      let failedCount = 0;
      let firstError: string | undefined;
      const failureReasons: string[] = [];

      try {
        for (
          let index = 0;
          index < uniqueIds.length;
          index += SEND_BATCH_SIZE
        ) {
          const batch = uniqueIds.slice(index, index + SEND_BATCH_SIZE);
          try {
            const response = await fetch("/api/notifications/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                targetUserId: batch,
                title: title.trim(),
                body: body.trim(),
              }),
            });
            const result = (await response.json()) as {
              ok?: boolean;
              successfulUsersCount?: number;
              failedUsersCount?: number;
              failures?: { userId: string; reason: string }[];
              reason?: string;
              error?: string;
            };

            if (!response.ok || !result.ok) {
              throw new Error(
                result.reason ?? result.error ?? "Notification batch failed.",
              );
            }

            sentCount += result.successfulUsersCount ?? 0;
            failedCount += result.failedUsersCount ?? 0;
            for (const failure of result.failures ?? []) {
              failureReasons.push(failure.reason);
            }
          } catch (error) {
            failedCount += batch.length;
            firstError ??=
              error instanceof Error
                ? error.message
                : "Notification batch failed.";
          }
        }
      } finally {
        setIsSending(false);
      }

      const error =
        firstError ??
        (failedCount > 0
          ? `${failedCount} recipient(s) did not receive the notification${describePartialFailure(failureReasons)}.`
          : undefined);
      setSendError(error ?? null);
      return { skipped: false, sentCount, failedCount, error };
    },
    [body, title],
  );

  useImperativeHandle(
    ref,
    () => ({
      isEnabled: () => isEnabled,
      sendIfEnabled: async (explicitUserIds) => {
        if (!isUseInModal || !isEnabled) {
          return { skipped: true, sentCount: 0, failedCount: 0 };
        }
        return sendToUsers(explicitUserIds ?? targetUserIds);
      },
    }),
    [isEnabled, isUseInModal, sendToUsers, targetUserIds],
  );

  function updateFilter<K extends keyof RecipientFilters>(
    key: K,
    value: RecipientFilters[K],
  ) {
    setSelectedUserIds(null);
    setFilters((previous) => ({ ...previous, [key]: value }));
  }

  function toggleRecipient(userId: string) {
    setSelectedUserIds((current) => {
      const allIds = recipients.map((recipient) => recipient.userId);
      const next = current
        ? current.includes(userId)
          ? current.filter((id) => id !== userId)
          : [...current, userId]
        : allIds.filter((id) => id !== userId);
      return next.length === allIds.length ? null : next;
    });
  }

  function toggleAllRecipients(checked: boolean) {
    setSelectedUserIds(checked ? null : []);
  }

  async function handleProfileSend() {
    const ids =
      selectedUserIds === null
        ? recipients.map((recipient) => recipient.userId)
        : selectedUserIds;
    const result = await sendToUsers(ids);
    if (result.error) {
      toast({
        title: result.sentCount
          ? "Notification partially sent"
          : "Unable to send notification",
        description: result.error,
        variant: "error",
      });
      return;
    }
    toast({
      title: "Notification sent",
      description: `Sent to ${result.sentCount} user(s).`,
      variant: "success",
    });
  }

  const selectedCount =
    selectedUserIds === null ? recipients.length : selectedUserIds.length;

  return (
    <section className="rounded-2xl border border-orange-subtle-2 bg-white/95 p-5 shadow-[0_8px_30px_rgba(43,36,32,0.06)] sm:p-6">
      {isUseInModal ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-subtle-2 text-orange-secondary">
                <Bell aria-hidden className="size-4" />
              </span>
              <p className="text-sm font-medium text-black-1">
                {inModalText ?? "Send a push notification"}
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={(enabled) => updateDraft({ enabled })}
              aria-label="Enable notification for this action"
              disabled={isSending}
            />
          </div>

          {isEnabled && (
            <div className="mt-4 space-y-3">
              <label className="block space-y-1.5 text-sm font-medium text-black-2">
                Notification title
                <Input
                  value={title}
                  onChange={(event) =>
                    updateDraft({
                      autoFill: false,
                      title: event.target.value,
                      body,
                    })
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.preventDefault();
                  }}
                  maxLength={200}
                  disabled={!isEnabled || isSending}
                />
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-black-2">
                Notification body
                <textarea
                  value={body}
                  onChange={(event) =>
                    updateDraft({
                      autoFill: false,
                      title,
                      body: event.target.value,
                    })
                  }
                  maxLength={2000}
                  rows={3}
                  disabled={!isEnabled || isSending}
                  className={`${FIELD_CLASS} resize-y`}
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-black-3">
                <input
                  type="checkbox"
                  checked={autoFill}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    updateDraft({
                      autoFill: checked,
                      title,
                      body,
                    });
                  }}
                  disabled={!isEnabled || isSending}
                  className="size-4 accent-orange-secondary"
                />
                Auto fill title and body
              </label>
              {sendError && (
                <p role="alert" className="text-xs text-negative-primary">
                  {sendError}
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-subtle-2 text-orange-secondary">
              <Bell aria-hidden className="size-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-black-1">
                Send notification
              </h2>
              <p className="text-xs text-black-3">
                Choose an audience and send a push notification.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <label className="space-y-1 text-xs font-medium text-black-2">
              Department
              <Select
                value={filters.department}
                onChange={(event) =>
                  updateFilter("department", event.target.value)
                }
                disabled={isSending}
              >
                <option value="">All</option>
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-1 text-xs font-medium text-black-2">
              Year
              <Select
                value={filters.year}
                onChange={(event) => updateFilter("year", event.target.value)}
                disabled={isSending}
              >
                <option value="">All</option>
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    Year {year}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-1 text-xs font-medium text-black-2">
              Dorm building
              <Select
                value={filters.dormBuilding}
                onChange={(event) =>
                  updateFilter("dormBuilding", event.target.value)
                }
                disabled={isSending}
              >
                <option value="">All</option>
                {DORM_BUILDINGS.map((building) => (
                  <option key={building} value={building}>
                    Building {building}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-1 text-xs font-medium text-black-2">
              Dorm room
              <Input
                value={filters.dormRoom}
                onChange={(event) =>
                  updateFilter("dormRoom", event.target.value)
                }
                placeholder="All rooms"
                maxLength={50}
                disabled={isSending}
              />
            </label>
          </div>

          <div className="mt-4">
            <div>
              <p className="mb-1.5 text-xs font-medium text-black-2">
                Recipients
              </p>
              <details className="group relative">
                <summary
                  className={`${FIELD_CLASS} flex cursor-pointer list-none items-center justify-between`}
                >
                  <span>
                    {isLoadingRecipients
                      ? "Loading users…"
                      : `${selectedCount} of ${recipients.length} selected`}
                  </span>
                  <span aria-hidden className="text-black-3">
                    ▾
                  </span>
                </summary>
                <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-black-5 bg-white p-2 shadow-lg">
                  {recipientError ? (
                    <p
                      role="alert"
                      className="p-2 text-xs text-negative-primary"
                    >
                      {recipientError}
                    </p>
                  ) : isLoadingRecipients ? (
                    <p className="p-2 text-xs text-black-3">Loading users…</p>
                  ) : recipients.length === 0 ? (
                    <p className="p-2 text-xs text-black-3">
                      No users match these filters.
                    </p>
                  ) : (
                    <>
                      <label className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-black-1 hover:bg-black-6">
                        <input
                          type="checkbox"
                          checked={selectedUserIds === null}
                          onChange={(event) =>
                            toggleAllRecipients(event.target.checked)
                          }
                          className="size-4 accent-orange-secondary"
                        />
                        All matching users
                      </label>
                      <div className="my-1 border-t border-black-6" />
                      {recipients.map((recipient) => {
                        const selected =
                          selectedUserIds === null ||
                          selectedUserIds.includes(recipient.userId);
                        return (
                          <label
                            key={recipient.userId}
                            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-black-2 hover:bg-black-6"
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleRecipient(recipient.userId)}
                              className="size-4 accent-orange-secondary"
                            />
                            <span>
                              {recipient.studentId ?? "No student ID"}
                            </span>
                          </label>
                        );
                      })}
                    </>
                  )}
                </div>
              </details>
              {recipientError && (
                <p role="alert" className="mt-1 text-xs text-negative-primary">
                  {recipientError}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <label className="block space-y-1.5 text-xs font-medium text-black-2">
              Notification title
              <Input
                value={title}
                onChange={(event) => updateDraft({ title: event.target.value })}
                maxLength={200}
                placeholder="Notification title"
                disabled={isSending}
                className="w-full"
              />
            </label>
            <label className="block space-y-1.5 text-xs font-medium text-black-2">
              Notification body
              <textarea
                value={body}
                onChange={(event) => updateDraft({ body: event.target.value })}
                maxLength={2000}
                placeholder="Notification body"
                rows={5}
                disabled={isSending}
                className={`${FIELD_CLASS} min-h-32 resize-y`}
              />
            </label>
          </div>
          {sendError && (
            <p role="alert" className="mt-3 text-xs text-negative-primary">
              {sendError}
            </p>
          )}
          <div className="mt-4 flex justify-end border-t border-orange-subtle-2 pt-4">
            <Button
              type="button"
              onClick={() => void handleProfileSend()}
              disabled={
                isSending ||
                isLoadingRecipients ||
                !!recipientError ||
                selectedCount === 0 ||
                !title.trim() ||
                !body.trim()
              }
              className="bg-orange-secondary text-white hover:brightness-90"
            >
              <Send aria-hidden />
              {isSending ? "Sending…" : "Send notification"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
});
