"use client";

import * as React from "react";
import {
  Check,
  CircleX,
  PackageCheck,
  RotateCcw,
  UserRound,
  X,
} from "lucide-react";

import { ActionDialog } from "@/components/action-dialog";
import {
  SendNotificationButton,
  type SendNotificationHandle,
} from "@/components/send-notification-button";
import {
  DataTable,
  type DataTableColumn,
  type PaginationState,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  useAcceptLoan,
  useCancelLoan,
  useDeliverLoan,
  useMarkLoanNoShow,
  useRejectLoan,
  useReturnLoan,
  useLoans,
} from "@/hooks/use-loan";
import { useToast } from "@/hooks/use-toast";
import type {
  LoanFilters,
  LoanRecord,
  LoanStatus,
} from "@/types/klongklongplus-types";

const STATUS_STYLES: Record<LoanStatus, string> = {
  pending: "bg-noti-warning-subtle text-black-2",
  approved: "bg-noti-positive-subtle text-black-2",
  delivered: "bg-orange-subtle-2 text-black-2",
  returned: "bg-noti-positive-subtle text-black-2",
  overdue: "bg-negative-subtle text-negative-primary",
  cancelled: "bg-muted text-muted-foreground",
  rejected: "bg-muted text-muted-foreground",
  expired: "bg-muted text-muted-foreground",
  no_show: "bg-muted text-muted-foreground",
};

function formatStatus(status: LoanStatus) {
  if (status === "no_show") return "No show";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatSlotDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function borrowerName(loan: LoanRecord) {
  const name = [loan.borrower?.firstName, loan.borrower?.lastName]
    .filter(Boolean)
    .join(" ");
  return name || loan.borrower?.email || "Unknown borrower";
}

function assignedAdminName(loan: LoanRecord) {
  return (
    [loan.approver?.firstName, loan.approver?.lastName]
      .filter(Boolean)
      .join(" ") || "another administrator"
  );
}

export function AdminLoansPage({ adminId }: { adminId: string }) {
  const [page, setPage] = React.useState(1);
  const [filters, setFilters] = React.useState<LoanFilters>({});
  const { toast } = useToast();
  const { data, error, isLoading } = useLoans(filtersWithPage(filters, page));
  const pageData = data?.data;

  React.useEffect(() => {
    if (error) {
      toast({
        title: "Unable to load loans",
        description: error.message,
        variant: "error",
      });
    }
  }, [error, toast]);

  function updateFilter<K extends keyof LoanFilters>(
    key: K,
    value: LoanFilters[K],
  ) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value || undefined }));
  }

  function clearFilters() {
    setFilters({});
    setPage(1);
  }

  const columns: DataTableColumn<LoanRecord>[] = [
    {
      key: "borrower",
      header: "Borrower",
      cell: (loan) => (
        <div>
          <div className="font-medium">{borrowerName(loan)}</div>
          {loan.borrower?.studentId && (
            <div className="text-xs text-muted-foreground">
              {loan.borrower.studentId}
            </div>
          )}
        </div>
      ),
      className: "min-w-40",
    },
    {
      key: "unit",
      header: "Unit",
      cell: (loan) => loan.unit.code,
      className: "font-medium",
    },
    {
      key: "itemType",
      header: "Type",
      cell: (loan) =>
        loan.itemType.charAt(0).toUpperCase() + loan.itemType.slice(1),
    },
    {
      key: "slotDate",
      header: "Borrow date",
      cell: (loan) => formatSlotDate(loan.slotDate),
    },
    {
      key: "slot",
      header: "Time",
      cell: (loan) =>
        `${loan.slot.startTime.slice(0, 5)}–${loan.slot.endTime.slice(0, 5)}`,
    },
    {
      key: "status",
      header: "Status",
      cell: (loan) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[loan.status]}`}
        >
          {formatStatus(loan.status)}
        </span>
      ),
    },
    {
      key: "manage",
      header: "Next action",
      cell: (loan) => <LoanActions loan={loan} adminId={adminId} />,
      className: "min-w-44",
    },
  ];

  const pagination: PaginationState = {
    page: pageData?.page ?? page,
    pageSize: pageData?.pageSize ?? 20,
    total: pageData?.total ?? 0,
    totalPages: Math.ceil((pageData?.total ?? 0) / (pageData?.pageSize ?? 20)),
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-black-1">
          Loan management
        </h1>
        <p className="text-sm text-black-3">
          Review requests and move each loan through its available next step.
        </p>
      </header>

      <section
        aria-label="Filter loans"
        className="grid gap-3 rounded-lg border border-orange-subtle-2 bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="space-y-1.5 text-sm font-medium text-black-2">
          Borrower name
          <Input
            className="h-8 text-sm"
            value={filters.searchName ?? ""}
            onChange={(event) => updateFilter("searchName", event.target.value)}
            placeholder="Search name"
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-black-2">
          Unit code
          <Input
            className="h-8 text-sm"
            value={filters.unitSearch ?? ""}
            onChange={(event) => updateFilter("unitSearch", event.target.value)}
            placeholder="Search unit code"
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-black-2">
          Status
          <Select
            className="h-8 text-sm"
            value={filters.status ?? ""}
            onChange={(event) =>
              updateFilter(
                "status",
                (event.target.value || undefined) as LoanStatus | undefined,
              )
            }
          >
            <option value="">All statuses</option>
            {(Object.keys(STATUS_STYLES) as LoanStatus[]).map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </Select>
        </label>
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={!Object.values(filters).some(Boolean)}
          >
            Clear filters
          </Button>
        </div>
      </section>

      <DataTable
        columns={columns}
        data={pageData?.items ?? []}
        getRowKey={(loan) => loan.id}
        pagination={pagination}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage={
          Object.values(filters).some(Boolean)
            ? "No loans match these filters."
            : "There are no loans to manage."
        }
      />
    </main>
  );
}

function filtersWithPage(filters: LoanFilters, page: number): LoanFilters {
  return { ...filters, page };
}

type LoanAction =
  "approve" | "reject" | "deliver" | "return" | "no-show" | "cancel";

function LoanActions({ loan, adminId }: { loan: LoanRecord; adminId: string }) {
  const [activeAction, setActiveAction] = React.useState<LoanAction | null>(
    null,
  );
  const [detail, setDetail] = React.useState("");
  const [isSendingDecisionNotification, setIsSendingDecisionNotification] =
    React.useState(false);
  const notificationRef = React.useRef<SendNotificationHandle>(null);
  const { toast } = useToast();
  const { trigger: accept, isMutating: isAccepting } = useAcceptLoan(loan.id);
  const { trigger: reject, isMutating: isRejecting } = useRejectLoan(loan.id);
  const { trigger: deliver, isMutating: isDelivering } = useDeliverLoan(
    loan.id,
  );
  const { trigger: returnLoan, isMutating: isReturning } = useReturnLoan(
    loan.id,
  );
  const { trigger: markNoShow, isMutating: isMarkingNoShow } =
    useMarkLoanNoShow(loan.id);
  const { trigger: cancel, isMutating: isCancelling } = useCancelLoan(loan.id);
  const isLoading =
    isAccepting ||
    isRejecting ||
    isDelivering ||
    isReturning ||
    isMarkingNoShow ||
    isCancelling ||
    isSendingDecisionNotification;
  const isResponsibleAdmin = loan.approver?.userId === adminId;

  const openAction = (action: LoanAction) => {
    setDetail("");
    setActiveAction(action);
  };

  async function handleAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeAction) return;
    if (
      (activeAction === "reject" || activeAction === "cancel") &&
      !detail.trim()
    ) {
      return;
    }

    try {
      switch (activeAction) {
        case "approve":
          await accept();
          break;
        case "reject":
          await reject({ reason: detail.trim() });
          break;
        case "deliver":
          await deliver(detail.trim() ? { condition: detail.trim() } : {});
          break;
        case "return":
          await returnLoan(detail.trim() ? { condition: detail.trim() } : {});
          break;
        case "no-show":
          await markNoShow();
          break;
        case "cancel":
          await cancel({ reason: detail.trim() });
          break;
      }
      if (activeAction === "approve" || activeAction === "reject") {
        setIsSendingDecisionNotification(true);
        try {
          const notification = await notificationRef.current?.sendIfEnabled();
          if (notification && !notification.skipped) {
            toast(
              notification.error
                ? {
                    title: "Loan updated; notification not fully sent",
                    description: notification.error,
                    variant: "error",
                  }
                : {
                    title: "Borrower notified",
                    description: `Sent to ${notification.sentCount} user(s).`,
                    variant: "success",
                  },
            );
          }
        } catch (notificationError) {
          toast({
            title: "Loan updated; notification could not be sent",
            description:
              notificationError instanceof Error
                ? notificationError.message
                : "Please try again.",
            variant: "error",
          });
        } finally {
          setIsSendingDecisionNotification(false);
        }
      }
      toast({ title: "Loan status updated", variant: "success" });
      setActiveAction(null);
    } catch (error) {
      toast({
        title: "Unable to update loan",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  if (loan.status === "pending") {
    return (
      <>
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-orange-subtle-2 px-2"
            onClick={() => openAction("approve")}
          >
            <Check className="size-4" />
            Approve
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-negative-primary"
            onClick={() => openAction("reject")}
          >
            <X className="size-4" />
            Reject
          </Button>
        </div>
        <LoanActionDialog
          action={activeAction}
          detail={detail}
          setDetail={setDetail}
          isLoading={isLoading}
          onClose={() => setActiveAction(null)}
          onSubmit={handleAction}
          notificationRef={notificationRef}
          borrowerId={loan.borrowerId}
        />
      </>
    );
  }

  if (loan.status === "approved" && isResponsibleAdmin) {
    return (
      <>
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-orange-subtle-2 px-2"
            onClick={() => openAction("deliver")}
          >
            <PackageCheck className="size-4" />
            Hand over
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => openAction("no-show")}
          >
            No-show
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-negative-primary"
            aria-label={`Cancel loan for ${borrowerName(loan)}`}
            title="Cancel loan"
            onClick={() => openAction("cancel")}
          >
            <CircleX />
          </Button>
        </div>
        <LoanActionDialog
          action={activeAction}
          detail={detail}
          setDetail={setDetail}
          isLoading={isLoading}
          onClose={() => setActiveAction(null)}
          onSubmit={handleAction}
          notificationRef={notificationRef}
          borrowerId={loan.borrowerId}
        />
      </>
    );
  }

  if (["delivered", "overdue"].includes(loan.status) && isResponsibleAdmin) {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-orange-subtle-2 px-2"
          onClick={() => openAction("return")}
        >
          <RotateCcw className="size-4" />
          Confirm return
        </Button>
        <LoanActionDialog
          action={activeAction}
          detail={detail}
          setDetail={setDetail}
          isLoading={isLoading}
          onClose={() => setActiveAction(null)}
          onSubmit={handleAction}
          notificationRef={notificationRef}
          borrowerId={loan.borrowerId}
        />
      </>
    );
  }

  if (
    loan.status === "approved" ||
    loan.status === "delivered" ||
    loan.status === "overdue"
  ) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <UserRound className="size-3.5" />
        {loan.approver
          ? `Managed by ${assignedAdminName(loan)}`
          : "No administrator assigned"}
      </span>
    );
  }

  return (
    <span className="text-xs text-muted-foreground">No action needed</span>
  );
}

function LoanActionDialog({
  action,
  detail,
  setDetail,
  isLoading,
  onClose,
  onSubmit,
  notificationRef,
  borrowerId,
}: {
  action: LoanAction | null;
  detail: string;
  setDetail: (value: string) => void;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  notificationRef: React.Ref<SendNotificationHandle>;
  borrowerId: string;
}) {
  const actionLabels: Record<LoanAction, string> = {
    approve: "Approve loan",
    reject: "Reject request",
    deliver: "Confirm handover",
    return: "Confirm return",
    "no-show": "Mark no-show",
    cancel: "Cancel loan",
  };
  const descriptions: Record<LoanAction, string> = {
    approve: "You will become responsible for this loan’s remaining steps.",
    reject:
      "A reason is required. The requester will see that the request was rejected.",
    deliver: "Confirm that the equipment has been handed to the borrower.",
    return: "Confirm that the equipment has been returned.",
    "no-show": "Mark the approved request as a no-show.",
    cancel: "A reason is required to cancel this approved loan.",
  };
  const requiresReason = action === "reject" || action === "cancel";
  const hasCondition = action === "deliver" || action === "return";

  return (
    <ActionDialog
      open={!!action}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={action ? actionLabels[action] : ""}
      description={action ? descriptions[action] : undefined}
      actionLabel={action ? actionLabels[action] : "Confirm"}
      actionType="submit"
      actionForm="admin-loan-action-form"
      onCancel={onClose}
      isLoading={isLoading}
      loadingLabel="Updating…"
      isActionDisabled={requiresReason && !detail.trim()}
      actionVariant={
        action === "reject" || action === "cancel" ? "destructive" : "default"
      }
    >
      <form
        id="admin-loan-action-form"
        onSubmit={(event) => void onSubmit(event)}
        className="space-y-3"
      >
        {(requiresReason || hasCondition) && (
          <label className="block space-y-1.5 text-sm font-medium text-black-2">
            {requiresReason ? "Reason" : "Condition note (optional)"}
            <Input
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              placeholder={
                requiresReason
                  ? "Enter a reason"
                  : "Add a note about the equipment condition"
              }
              required={requiresReason}
              disabled={isLoading}
              maxLength={500}
            />
          </label>
        )}
        {(action === "approve" || action === "reject") && (
          <SendNotificationButton
            ref={notificationRef}
            isUseInModal
            inModalText="Notify the borrower about this decision"
            notificationTitle={
              action === "approve"
                ? "Your loan has been accepted"
                : "Your loan has been rejected"
            }
            notificationBody={
              action === "approve"
                ? "Your loan request was accepted. Open the app to view details."
                : "Your loan request was rejected. Open the app to view details."
            }
            targetUserIds={[borrowerId]}
          />
        )}
      </form>
    </ActionDialog>
  );
}
