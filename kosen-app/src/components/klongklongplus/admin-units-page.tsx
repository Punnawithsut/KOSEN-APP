"use client";

import * as React from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import { ActionDialog } from "@/components/action-dialog";
import { BackLink } from "@/components/back-link";
import {
  DataTable,
  type DataTableColumn,
  type PaginationState,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  useCreateUnit,
  useDeleteUnit,
  useUnits,
  useUpdateUnit,
  useUpdateUnitStatus,
} from "@/hooks/use-unit";
import { useToast } from "@/hooks/use-toast";
import type {
  CreateUnitData,
  ItemType,
  Unit,
  UnitFilters,
  UnitStatus,
  UpdateUnitData,
} from "@/types/klongklongplus-types";

const STATUS_LABELS: Record<UnitStatus, string> = {
  available: "Available",
  out: "Checked out",
  repair: "Needs repair",
  lost: "Lost",
};

function itemTypeLabel(itemType: ItemType) {
  return itemType === "calculator" ? "Calculator" : "Charger";
}

export function AdminUnitsPage() {
  const [page, setPage] = React.useState(1);
  const [itemType, setItemType] = React.useState<ItemType | "">("");
  const [status, setStatus] = React.useState<UnitStatus | "">("");
  const [active, setActive] = React.useState<"" | "true" | "false">("");
  const [search, setSearch] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingUnit, setEditingUnit] = React.useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = React.useState<Unit | null>(null);
  const { toast } = useToast();
  const filters: UnitFilters = {
    page,
    itemType: itemType || undefined,
    status: status || undefined,
    isActive: active === "" ? undefined : active === "true",
    search: search.trim() || undefined,
  };
  const { data, error, isLoading } = useUnits(filters);
  const { trigger: deleteUnit, isMutating: isDeleting } = useDeleteUnit(
    deletingUnit?.id ?? "",
  );
  const pageData = data?.data;

  React.useEffect(() => {
    if (error) {
      toast({
        title: "Unable to load units",
        description: error.message,
        variant: "error",
      });
    }
  }, [error, toast]);

  async function handleDelete() {
    if (!deletingUnit) return;
    try {
      await deleteUnit();
      toast({ title: "Unit deleted", variant: "success" });
      setDeletingUnit(null);
    } catch (error) {
      toast({
        title: "Unable to delete unit",
        description:
          error instanceof Error
            ? error.message
            : "Units with loan history cannot be deleted; deactivate them instead.",
        variant: "error",
      });
    }
  }

  const columns: DataTableColumn<Unit>[] = [
    {
      key: "code",
      header: "Unit code",
      cell: (unit) => <span className="font-medium">{unit.code}</span>,
    },
    {
      key: "itemType",
      header: "Type",
      cell: (unit) => itemTypeLabel(unit.itemType),
    },
    {
      key: "status",
      header: "Condition",
      cell: (unit) => STATUS_LABELS[unit.status],
    },
    {
      key: "isActive",
      header: "Borrowing",
      cell: (unit) => (
        <span
          className={
            unit.isActive
              ? "rounded-full bg-noti-positive-subtle px-2.5 py-0.5 text-xs font-medium text-black-2"
              : "rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
          }
        >
          {unit.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "note",
      header: "Note",
      cell: (unit) => unit.note || "—",
      className: "max-w-56 truncate",
    },
    {
      key: "manage",
      header: "Manage",
      cell: (unit) => (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${itemTypeLabel(unit.itemType)} ${unit.code}`}
            title="Edit unit"
            onClick={() => {
              setEditingUnit(unit);
              setIsFormOpen(true);
            }}
          >
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-negative-primary"
            aria-label={`Delete ${itemTypeLabel(unit.itemType)} ${unit.code}`}
            title="Delete unit"
            onClick={() => setDeletingUnit(unit)}
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

  function resetPageAnd(update: () => void) {
    update();
    setPage(1);
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <BackLink href="/admin/" label="Back to admin" sticky />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-black-1">
            Unit management
          </h1>
          <p className="text-sm text-black-3">
            Manage unit identifiers, type, condition, notes, and borrower
            availability.
          </p>
        </div>
        <Button
          type="button"
          className="gap-2 bg-orange-secondary text-white hover:brightness-90"
          onClick={() => {
            setEditingUnit(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add unit
        </Button>
      </header>

      <section
        aria-label="Filter units"
        className="grid gap-3 rounded-lg border border-orange-subtle-2 bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="space-y-1.5 text-sm font-medium text-black-2">
          Search
          <span className="relative block">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 pl-8 text-sm"
              value={search}
              onChange={(event) =>
                resetPageAnd(() => setSearch(event.target.value))
              }
              placeholder="Code or note"
            />
          </span>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-black-2">
          Type
          <Select
            className="h-8 text-sm"
            value={itemType}
            onChange={(event) =>
              resetPageAnd(
                () => setItemType(event.target.value as ItemType | ""),
              )
            }
          >
            <option value="">All types</option>
            <option value="calculator">Calculator</option>
            <option value="charger">Charger</option>
          </Select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-black-2">
          Condition
          <Select
            className="h-8 text-sm"
            value={status}
            onChange={(event) =>
              resetPageAnd(
                () => setStatus(event.target.value as UnitStatus | ""),
              )
            }
          >
            <option value="">All conditions</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-black-2">
          Borrowing
          <Select
            className="h-8 text-sm"
            value={active}
            onChange={(event) =>
              resetPageAnd(
                () => setActive(event.target.value as "" | "true" | "false"),
              )
            }
          >
            <option value="">All units</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </label>
      </section>

      <DataTable
        columns={columns}
        data={pageData?.items ?? []}
        getRowKey={(unit) => unit.id}
        pagination={pagination}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage={
          itemType || status || active || search
            ? "No units match these filters."
            : "No units have been created yet."
        }
      />

      {isFormOpen && (
        <UnitFormDialog
          unit={editingUnit}
          onClose={() => {
            setIsFormOpen(false);
            setEditingUnit(null);
          }}
        />
      )}
      <ActionDialog
        open={!!deletingUnit}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingUnit(null);
        }}
        title="Delete unit?"
        description={`Delete ${itemTypeLabel(deletingUnit?.itemType ?? "calculator")} ${deletingUnit?.code ?? ""}?`}
        actionLabel="Delete unit"
        actionVariant="destructive"
        onCancel={() => setDeletingUnit(null)}
        onAction={() => void handleDelete()}
        isLoading={isDeleting}
        loadingLabel="Deleting…"
      >
        <p className="text-sm text-black-3">
          Units with loan history cannot be deleted. Deactivate the unit instead
          to keep its loan records.
        </p>
      </ActionDialog>
    </main>
  );
}

function UnitFormDialog({
  unit,
  onClose,
}: {
  unit: Unit | null;
  onClose: () => void;
}) {
  const [code, setCode] = React.useState(unit?.code ?? "");
  const [itemType, setItemType] = React.useState<ItemType>(
    unit?.itemType ?? "calculator",
  );
  const [status, setStatus] = React.useState<UnitStatus>(
    unit?.status ?? "available",
  );
  const [note, setNote] = React.useState(unit?.note ?? "");
  const [isActive, setIsActive] = React.useState(unit?.isActive ?? true);
  const { toast } = useToast();
  const { trigger: createUnit, isMutating: isCreating } = useCreateUnit();
  const { trigger: updateUnit, isMutating: isUpdating } = useUpdateUnit(
    unit?.id ?? "",
  );
  const { trigger: updateStatus, isMutating: isUpdatingStatus } =
    useUpdateUnitStatus(unit?.id ?? "");
  const isLoading = isCreating || isUpdating || isUpdatingStatus;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values: CreateUnitData = {
      code: code.trim(),
      itemType,
      note: note.trim() || undefined,
    };

    try {
      if (unit) {
        await updateUnit({
          ...values,
          isActive,
        } satisfies UpdateUnitData);
        if (status !== unit.status) {
          await updateStatus({ status });
        }
      } else {
        await createUnit(values);
      }
      toast({
        title: unit ? "Unit updated" : "Unit created",
        variant: "success",
      });
      onClose();
    } catch (error) {
      toast({
        title: unit ? "Unable to update unit" : "Unable to create unit",
        description:
          error instanceof Error ? error.message : "Please try again.",
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
      title={unit ? "Edit unit" : "Create unit"}
      description="Set the unit code and equipment details. Inactive units cannot be borrowed."
      actionLabel={unit ? "Save changes" : "Create unit"}
      actionType="submit"
      actionForm="admin-unit-form"
      onCancel={onClose}
      isLoading={isLoading}
      loadingLabel="Saving…"
    >
      <form
        id="admin-unit-form"
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-4"
      >
        <label className="block space-y-1.5 text-sm font-medium text-black-2">
          Unit code
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="e.g. CAL-001"
            maxLength={100}
            required
            disabled={isLoading}
          />
        </label>
        <label className="block space-y-1.5 text-sm font-medium text-black-2">
          Equipment type
          <Select
            value={itemType}
            onChange={(event) => setItemType(event.target.value as ItemType)}
            disabled={isLoading}
          >
            <option value="calculator">Calculator</option>
            <option value="charger">Charger</option>
          </Select>
        </label>
        {unit && (
          <label className="block space-y-1.5 text-sm font-medium text-black-2">
            Condition
            <Select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as UnitStatus)
              }
              disabled={isLoading}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
        )}
        <label className="block space-y-1.5 text-sm font-medium text-black-2">
          Note
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional details about this unit"
            maxLength={1000}
            rows={3}
            disabled={isLoading}
            className="w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          />
        </label>
        {unit && (
          <label className="flex items-center gap-2 text-sm font-medium text-black-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              disabled={isLoading}
              className="size-4 accent-orange-secondary"
            />
            Unit is active and available for borrowing
          </label>
        )}
      </form>
    </ActionDialog>
  );
}
