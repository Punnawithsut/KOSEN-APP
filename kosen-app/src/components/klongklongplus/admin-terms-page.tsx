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
import { useCreateTerm, useDeleteTerm, useTerms } from "@/hooks/use-term";
import { useToast } from "@/hooks/use-toast";
import type {
  CreateTermData,
  Term,
  UpdateTermData,
} from "@/types/klongklongplus-types";
import { useUpdateTerm } from "@/hooks/use-term";

export function AdminTermsPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [searchValue, setSearchValue] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTerm, setEditingTerm] = React.useState<Term | null>(null);
  const [deletingTerm, setDeletingTerm] = React.useState<Term | null>(null);
  const { toast } = useToast();
  const { data, error, isLoading } = useTerms({ page, search });
  const { trigger: deleteTerm, isMutating: isDeleting } = useDeleteTerm(
    deletingTerm?.id ?? "",
  );
  const pageData = data?.data;

  React.useEffect(() => {
    if (error) {
      toast({
        title: "Unable to load terms",
        description: error.message,
        variant: "error",
      });
    }
  }, [error, toast]);

  async function handleDelete() {
    if (!deletingTerm) return;
    try {
      await deleteTerm();
      toast({ title: "Term deleted", variant: "success" });
      setDeletingTerm(null);
    } catch (error) {
      toast({
        title: "Unable to delete term",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  const columns: DataTableColumn<Term>[] = [
    {
      key: "name",
      header: "Term",
      cell: (term) => <span className="font-medium">{term.name}</span>,
    },
    {
      key: "period",
      header: "Term dates",
      cell: (term) => `${term.startDate} – ${term.endDate}`,
      className: "whitespace-nowrap",
    },
    {
      key: "midterm",
      header: "Midterm",
      cell: (term) =>
        term.midtermStartDate && term.midtermEndDate
          ? `${term.midtermStartDate} – ${term.midtermEndDate}`
          : "—",
      className: "whitespace-nowrap",
    },
    {
      key: "finalExam",
      header: "Final exam",
      cell: (term) =>
        term.finalExamStartDate && term.finalExamEndDate
          ? `${term.finalExamStartDate} – ${term.finalExamEndDate}`
          : "—",
      className: "whitespace-nowrap",
    },
    {
      key: "manage",
      header: "Manage",
      cell: (term) => (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit term ${term.name}`}
            onClick={() => {
              setEditingTerm(term);
              setIsFormOpen(true);
            }}
          >
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete term ${term.name}`}
            onClick={() => setDeletingTerm(term)}
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
            Term management
          </h1>
          <p className="text-sm text-black-3">
            Manage term dates and optional exam periods.
          </p>
        </div>
        <Button
          type="button"
          className="gap-2 bg-orange-secondary text-white hover:brightness-90"
          onClick={() => {
            setEditingTerm(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add term
        </Button>
      </header>

      <form
        className="flex max-w-xl items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch(searchValue.trim());
        }}
      >
        <label className="flex-1 space-y-1.5 text-sm font-medium text-black-2">
          Search terms
          <Input
            className="h-8 text-sm"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search by term name"
          />
        </label>
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      <DataTable
        columns={columns}
        data={pageData?.items ?? []}
        getRowKey={(term) => term.id}
        pagination={pagination}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage={
          search
            ? "No terms match this search."
            : "No terms have been created yet."
        }
      />

      {isFormOpen && (
        <TermFormDialog
          term={editingTerm}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTerm(null);
          }}
        />
      )}
      <ActionDialog
        open={!!deletingTerm}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingTerm(null);
        }}
        title="Delete term?"
        description={`Delete ${deletingTerm?.name ?? "this term"}? Terms referenced by loans may not be removable.`}
        actionLabel="Delete term"
        actionVariant="destructive"
        onCancel={() => setDeletingTerm(null)}
        onAction={() => void handleDelete()}
        isLoading={isDeleting}
        loadingLabel="Deleting…"
      >
        <p className="text-sm text-black-3">
          This removes the term from future selection. Existing loan records are
          not deleted.
        </p>
      </ActionDialog>
    </main>
  );
}

function TermFormDialog({
  term,
  onClose,
}: {
  term: Term | null;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(term?.name ?? "");
  const [startDate, setStartDate] = React.useState(term?.startDate ?? "");
  const [endDate, setEndDate] = React.useState(term?.endDate ?? "");
  const [midtermStartDate, setMidtermStartDate] = React.useState(
    term?.midtermStartDate ?? "",
  );
  const [midtermEndDate, setMidtermEndDate] = React.useState(
    term?.midtermEndDate ?? "",
  );
  const [finalExamStartDate, setFinalExamStartDate] = React.useState(
    term?.finalExamStartDate ?? "",
  );
  const [finalExamEndDate, setFinalExamEndDate] = React.useState(
    term?.finalExamEndDate ?? "",
  );
  const { toast } = useToast();
  const { trigger: createTerm, isMutating: isCreating } = useCreateTerm();
  const { trigger: updateTerm, isMutating: isUpdating } = useUpdateTerm(
    term?.id ?? "",
  );
  const isLoading = isCreating || isUpdating;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values: CreateTermData = {
      name: name.trim(),
      startDate,
      endDate,
      midtermStartDate: midtermStartDate || null,
      midtermEndDate: midtermEndDate || null,
      finalExamStartDate: finalExamStartDate || null,
      finalExamEndDate: finalExamEndDate || null,
    };

    try {
      if (term) {
        await updateTerm(values satisfies UpdateTermData);
      } else {
        await createTerm(values);
      }
      toast({
        title: term ? "Term updated" : "Term created",
        variant: "success",
      });
      onClose();
    } catch (error) {
      toast({
        title: term ? "Unable to update term" : "Unable to create term",
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
      title={term ? `Edit term ${term.name}` : "Create term"}
      description="Set the term period and any exam date ranges."
      actionLabel={term ? "Save changes" : "Create term"}
      actionType="submit"
      actionForm="admin-term-form"
      onCancel={onClose}
      isLoading={isLoading}
      loadingLabel="Saving…"
    >
      <form
        id="admin-term-form"
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-4"
      >
        <label className="block space-y-1.5 text-sm font-medium text-black-2">
          Term name
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            required
            disabled={isLoading}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <DateField
            label="Term starts"
            value={startDate}
            onChange={setStartDate}
            disabled={isLoading}
            required
          />
          <DateField
            label="Term ends"
            value={endDate}
            onChange={setEndDate}
            disabled={isLoading}
            required
          />
          <DateField
            label="Midterm starts"
            value={midtermStartDate}
            onChange={setMidtermStartDate}
            disabled={isLoading}
          />
          <DateField
            label="Midterm ends"
            value={midtermEndDate}
            onChange={setMidtermEndDate}
            disabled={isLoading}
          />
          <DateField
            label="Final exam starts"
            value={finalExamStartDate}
            onChange={setFinalExamStartDate}
            disabled={isLoading}
          />
          <DateField
            label="Final exam ends"
            value={finalExamEndDate}
            onChange={setFinalExamEndDate}
            disabled={isLoading}
          />
        </div>
      </form>
    </ActionDialog>
  );
}

function DateField({
  label,
  value,
  onChange,
  disabled,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-black-2">
      {label}
      <Input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={disabled}
      />
    </label>
  );
}
