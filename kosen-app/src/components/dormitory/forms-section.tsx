"use client";

import { useState } from "react";

import { AddButton, DeleteButton, EditButton } from "@/components/dormitory/admin-ui";
import { DeleteConfirmDialog } from "@/components/dormitory/delete-confirm-dialog";
import { FormDialog } from "@/components/dormitory/form-dialog";
import { FORM_ICONS } from "@/components/dormitory/form-icons";
import {
  FormPreviewDialog,
  dueBadge,
} from "@/components/dormitory/previews";
import { useToast } from "@/hooks/use-toast";
import type { DormForm } from "@/lib/dormitory/data";

export function FormsSection({
  forms,
  allForms = forms,
  isAdmin = false,
  onSave,
  onDelete,
}: {
  /** Forms to show (after search). */
  forms: DormForm[];
  /** Every form, so the duplicate-link check ignores the search filter. */
  allForms?: DormForm[];
  isAdmin?: boolean;
  onSave?: (form: DormForm) => void;
  onDelete?: (id: string) => Promise<void>;
}) {
  const { toast } = useToast();
  // undefined = closed, null = adding, form = editing.
  const [editing, setEditing] = useState<DormForm | null | undefined>(undefined);

  const [previewing, setPreviewing] = useState<DormForm | null>(null);
  const [deleting, setDeleting] = useState<DormForm | null>(null);

  return (
    <section aria-labelledby="forms-heading" className="flex flex-col gap-3">
      <div>
        <h2 id="forms-heading" className="font-display text-3xl text-black-1 md:text-4xl">
          Forms
        </h2>
        <p className="text-sm text-black-3">
          Tap a form to see its details and open it in Google Forms. Sign in with your @kmitl.ac.th account.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {forms.map((form) => {
          const { Icon } = FORM_ICONS[form.icon];
          const badge = dueBadge(form.closesAt);
          return (
            <li key={form.id} className="relative">
              <button
                type="button"
                onClick={() => setPreviewing(form)}
                className="flex h-full w-full flex-col gap-2 rounded-xl border bg-white p-4 text-left shadow-xs transition-all hover:border-orange-subtle-1 hover:shadow-md active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-secondary"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-black-6 text-black-2">
                  <Icon className="size-5" />
                </span>
                <span className="font-semibold text-black-1">{form.title}</span>
                <span className="text-xs text-black-3">{form.description}</span>
                <span
                  className={`mt-auto w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}
                >
                  {badge.label}
                </span>
              </button>
              {isAdmin ? (
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  <EditButton label={`Edit ${form.title}`} onClick={() => setEditing(form)} />
                  <DeleteButton label={`Delete ${form.title}`} onClick={() => setDeleting(form)} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {previewing ? (
        <FormPreviewDialog form={previewing} onClose={() => setPreviewing(null)} />
      ) : null}
      <DeleteConfirmDialog
        open={deleting !== null}
        title="Delete form?"
        description={`“${deleting?.title ?? "This form"}” and its link will be removed.`}
        itemLabel="Form"
        onCancel={() => setDeleting(null)}
        onDelete={() => deleting && onDelete ? onDelete(deleting.id) : Promise.reject(new Error("Form deletion is unavailable."))}
      />
      {isAdmin ? (
        <AddButton label="Add form" onClick={() => setEditing(null)} />
      ) : null}
      {isAdmin && editing !== undefined ? (
        <FormDialog
          key={editing?.id ?? "new"}
          form={editing}
          takenUrls={allForms
            .filter((other) => other.id !== editing?.id)
            .map((other) => other.url)}
          onClose={() => setEditing(undefined)}
          onSave={(next) => {
            onSave?.(next);
            setEditing(undefined);
            toast({
              title: editing ? "Form updated" : "Form added",
              variant: "success",
            });
          }}
        />
      ) : null}
    </section>
  );
}
