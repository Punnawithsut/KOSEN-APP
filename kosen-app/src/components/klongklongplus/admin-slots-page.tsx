"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { ActionDialog } from "@/components/action-dialog";
import {
  DataTable,
  type DataTableColumn,
  type PaginationState,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  useCreateSlot,
  useDeleteSlot,
  useSlots,
  useUpdateSlot,
} from "@/hooks/use-slot";
import { useToast } from "@/hooks/use-toast";
import type {
  CreateSlotData,
  Slot,
  SlotFilters,
  SlotKind,
  UpdateSlotData,
} from "@/hooks/types/klongklongplus-types";

export function AdminSlotsPage() {
  const [page, setPage] = React.useState(1);
  const [kind, setKind] = React.useState<SlotKind | "">("");
  const [active, setActive] = React.useState<"" | "true" | "false">("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingSlot, setEditingSlot] = React.useState<Slot | null>(null);
  const [deletingSlot, setDeletingSlot] = React.useState<Slot | null>(null);
  const { toast } = useToast();
  const filters: SlotFilters = {
    page,
    kind: kind || undefined,
    isActive: active === "" ? undefined : active === "true",
  };
  const { data, error, isLoading } = useSlots(filters);
  const { trigger: deleteSlot, isMutating: isDeleting } = useDeleteSlot(
    deletingSlot?.id ?? "",
  );
  const pageData = data?.data;

  React.useEffect(() => {
    if (error) {
      toast({
        title: "Unable to load slots",
        description: error.message,
        variant: "error",
      });
    }
  }, [error, toast]);

  async function handleDelete() {
    if (!deletingSlot) return;
    try {
      await deleteSlot();
      toast({ title: "Slot deleted", variant: "success" });
      setDeletingSlot(null);
    } catch (error) {
      toast({
        title: "Unable to delete slot",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  const columns: DataTableColumn<Slot>[] = [
    {
      key: "kind",
      header: "Type",
      cell: (slot) => (
        <span className="font-medium">
          {slot.kind === "exam" ? "Exam" : "Normal"}
        </span>
      ),
    },
    {
      key: "time",
      header: "Time",
      cell: (slot) =>
        `${slot.startTime.slice(0, 5)} – ${slot.endTime.slice(0, 5)}`,
      className: "whitespace-nowrap",
    },
    {
      key: "leadMin",
      header: "Advance notice",
      cell: (slot) => `${slot.leadMin} min`,
    },
    {
      key: "displayOrder",
      header: "Order",
      cell: (slot) => slot.displayOrder,
    },
    {
      key: "isActive",
      header: "Availability",
      cell: (slot) => (
        <span
          className={
            slot.isActive
              ? "rounded-full bg-noti-positive-subtle px-2.5 py-0.5 text-xs font-medium text-black-2"
              : "rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
          }
        >
          {slot.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "manage",
      header: "Manage",
      cell: (slot) => (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${slot.kind} slot ${slot.startTime.slice(0, 5)}`}
            onClick={() => {
              setEditingSlot(slot);
              setIsFormOpen(true);
            }}
          >
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${slot.kind} slot ${slot.startTime.slice(0, 5)}`}
            onClick={() => setDeletingSlot(slot)}
          >
            <Trash2 />
          </Button>
        </div>
      ),
      className: "w-24",
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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-black-1">
            Slot management
          </h1>
          <p className="text-sm text-black-3">
            Configure pickup times and availability for borrowers.
          </p>
        </div>
        <Button
          type="button"
          className="gap-2 bg-orange-secondary text-white hover:brightness-90"
          onClick={() => {
            setEditingSlot(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add slot
        </Button>
      </header>

      <section
        aria-label="Filter slots"
        className="grid max-w-2xl gap-3 rounded-lg border border-orange-subtle-2 bg-background p-4 sm:grid-cols-2"
      >
        <label className="space-y-1.5 text-sm font-medium text-black-2">
          Slot type
          <Select
            className="h-8 text-sm"
            value={kind}
            onChange={(event) => {
              setKind(event.target.value as SlotKind | "");
              setPage(1);
            }}
          >
            <option value="">All types</option>
            <option value="normal">Normal</option>
            <option value="exam">Exam</option>
          </Select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-black-2">
          Availability
          <Select
            className="h-8 text-sm"
            value={active}
            onChange={(event) => {
              setActive(event.target.value as "" | "true" | "false");
              setPage(1);
            }}
          >
            <option value="">All slots</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </label>
      </section>

      <DataTable
        columns={columns}
        data={pageData?.items ?? []}
        getRowKey={(slot) => slot.id}
        pagination={pagination}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage={
          kind || active
            ? "No slots match these filters."
            : "No slots have been created yet."
        }
      />

      {isFormOpen && (
        <SlotFormDialog
          slot={editingSlot}
          onClose={() => {
            setIsFormOpen(false);
            setEditingSlot(null);
          }}
        />
      )}
      <ActionDialog
        open={!!deletingSlot}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingSlot(null);
        }}
        title="Delete slot?"
        description={`Delete the ${deletingSlot?.kind ?? ""} slot from ${deletingSlot?.startTime.slice(0, 5) ?? ""} to ${deletingSlot?.endTime.slice(0, 5) ?? ""}?`}
        actionLabel="Delete slot"
        actionVariant="destructive"
        onCancel={() => setDeletingSlot(null)}
        onAction={() => void handleDelete()}
        isLoading={isDeleting}
        loadingLabel="Deleting…"
      >
        <p className="text-sm text-black-3">
          Existing loan records remain unchanged. A slot referenced by a loan
          may not be removable.
        </p>
      </ActionDialog>
    </main>
  );
}

function SlotFormDialog({
  slot,
  onClose,
}: {
  slot: Slot | null;
  onClose: () => void;
}) {
  const [kind, setKind] = React.useState<SlotKind>(slot?.kind ?? "normal");
  const [startTime, setStartTime] = React.useState(
    slot?.startTime.slice(0, 5) ?? "",
  );
  const [endTime, setEndTime] = React.useState(
    slot?.endTime.slice(0, 5) ?? "",
  );
  const [leadMin, setLeadMin] = React.useState(String(slot?.leadMin ?? 0));
  const [displayOrder, setDisplayOrder] = React.useState(
    String(slot?.displayOrder ?? 0),
  );
  const [isActive, setIsActive] = React.useState(slot?.isActive ?? true);
  const { toast } = useToast();
  const { trigger: createSlot, isMutating: isCreating } = useCreateSlot();
  const { trigger: updateSlot, isMutating: isUpdating } = useUpdateSlot(
    slot?.id ?? "",
  );
  const isLoading = isCreating || isUpdating;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values: CreateSlotData = {
      kind,
      startTime,
      endTime,
      leadMin: Number(leadMin),
      displayOrder: Number(displayOrder),
      isActive,
    };

    try {
      if (slot) {
        await updateSlot(values satisfies UpdateSlotData);
      } else {
        await createSlot(values);
      }
      toast({
        title: slot ? "Slot updated" : "Slot created",
        variant: "success",
      });
      onClose();
    } catch (error) {
      toast({
        title: slot ? "Unable to update slot" : "Unable to create slot",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  return (
    <ActionDialog
      open
      onOpenChange={(open) => {
        if (!open && !isLoading) onClose();
      }}
      title={slot ? "Edit slot" : "Create slot"}
      description="Set the slot type, time range, and availability."
      actionLabel={slot ? "Save changes" : "Create slot"}
      actionType="submit"
      actionForm="admin-slot-form"
      onCancel={onClose}
      isLoading={isLoading}
      loadingLabel="Saving…"
    >
      <form
        id="admin-slot-form"
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-4"
      >
        <label className="block space-y-1.5 text-sm font-medium text-black-2">
          Slot type
          <Select
            value={kind}
            onChange={(event) => setKind(event.target.value as SlotKind)}
            disabled={isLoading}
          >
            <option value="normal">Normal</option>
            <option value="exam">Exam</option>
          </Select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm font-medium text-black-2">
            Starts
            <Input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              required
              disabled={isLoading}
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium text-black-2">
            Ends
            <Input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              required
              disabled={isLoading}
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium text-black-2">
            Advance notice (minutes)
            <Input
              type="number"
              min={0}
              step={1}
              value={leadMin}
              onChange={(event) => setLeadMin(event.target.value)}
              required
              disabled={isLoading}
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium text-black-2">
            Display order
            <Input
              type="number"
              min={0}
              step={1}
              value={displayOrder}
              onChange={(event) => setDisplayOrder(event.target.value)}
              required
              disabled={isLoading}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-black-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            disabled={isLoading}
            className="size-4 accent-orange-secondary"
          />
          Slot is active and available for requests
        </label>
      </form>
    </ActionDialog>
  );
}
