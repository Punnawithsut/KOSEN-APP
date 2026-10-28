"use client";

import { useId, useState, type FormEvent } from "react";

import { ActionDialog } from "@/components/action-dialog";
import {
  FIELD_CLASS,
  Field,
  FormError,
} from "@/components/dormitory/admin-ui";
import { FORM_ICONS } from "@/components/dormitory/form-icons";
import { Input } from "@/components/ui/input";
import type { DormForm, FormIconKey } from "@/lib/dormitory/data";
import {
  GOOGLE_FORM_PATTERN,
  fromDateInput,
  newId,
  toDateInput,
} from "@/lib/dormitory/utils";

/**
 * Add (`form` null) or edit one form. Each form owns exactly one Google Form
 * link; `takenUrls` are the links of the other forms, so one link cannot be
 * used by two cards.
 */
export function FormDialog({
  form,
  takenUrls,
  onSave,
  onClose,
}: {
  form: DormForm | null;
  takenUrls: string[];
  onSave: (next: DormForm) => void;
  onClose: () => void;
}) {
  const formId = `${useId()}-form`;
  const [title, setTitle] = useState(form?.title ?? "");
  const [description, setDescription] = useState(form?.description ?? "");
  const [url, setUrl] = useState(form?.url ?? "");
  const [icon, setIcon] = useState<FormIconKey>(form?.icon ?? "document");
  const [dueDate, setDueDate] = useState(toDateInput(form?.closesAt ?? null));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const link = url.trim();
    if (!GOOGLE_FORM_PATTERN.test(link)) {
      setError("Enter a Google Forms link (docs.google.com/forms or forms.gle).");
      return;
    }
    if (takenUrls.includes(link)) {
      setError("Another form already uses this link.");
      return;
    }
    onSave({
      id: form?.id ?? newId(),
      title: title.trim(),
      description: description.trim(),
      icon,
      url: link,
      closesAt: fromDateInput(dueDate),
    });
  }

  return (
    <ActionDialog
      open
      onOpenChange={() => {}}
      title={form ? "Edit form" : "Add form"}
      actionLabel="Save"
      actionType="submit"
      actionForm={formId}
      isActionDisabled={!title.trim() || !url.trim()}
      onCancel={onClose}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <FormError message={error} />
        <Field label="Name" htmlFor={`${formId}-title`}>
          <Input
            id={`${formId}-title`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={80}
          />
        </Field>
        <Field label="Explanation" htmlFor={`${formId}-description`}>
          <Input
            id={`${formId}-description`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={160}
          />
        </Field>
        <Field
          label="Google Form link"
          htmlFor={`${formId}-url`}
          hint="One link per form. You can change it later."
        >
          <Input
            id={`${formId}-url`}
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://docs.google.com/forms/…"
            required
          />
        </Field>
        <Field label="Due date" htmlFor={`${formId}-due`} hint="Leave empty for no due date.">
          <input
            id={`${formId}-due`}
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className={FIELD_CLASS}
          />
        </Field>
        <fieldset>
          <legend className="mb-1 text-xs font-medium text-black-2">Icon</legend>
          <div className="grid grid-cols-6 gap-2">
            {(Object.keys(FORM_ICONS) as FormIconKey[]).map((key) => {
              const { label, Icon } = FORM_ICONS[key];
              const selected = icon === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  aria-label={label}
                  title={label}
                  onClick={() => setIcon(key)}
                  className={`flex h-10 items-center justify-center rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-blue-secondary ${
                    selected
                      ? "border-blue-secondary bg-blue-subtle-2 text-blue-secondary"
                      : "border-black-5 bg-white text-black-3 hover:bg-black-6"
                  }`}
                >
                  <Icon className="size-5" />
                </button>
              );
            })}
          </div>
        </fieldset>
      </form>
    </ActionDialog>
  );
}
