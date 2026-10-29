"use client";

import { useId, useState, type FormEvent } from "react";

import { ActionDialog } from "@/components/action-dialog";
import {
  FILE_CLASS,
  Field,
  FormError,
  TEXTAREA_CLASS,
} from "@/components/dormitory/admin-ui";
import { Input } from "@/components/ui/input";
import type {
  DormHandbook,
  DormRule,
} from "@/lib/dormitory/data";
import { formatToday, newId } from "@/lib/dormitory/utils";

const MAX_BYTES = 50 * 1024 * 1024;

/**
 * Replaces the stored handbook PDF and its metadata.
 */
export function HandbookDialog({
  handbook,
  onSave,
  onClose,
}: {
  handbook: DormHandbook;
  onSave: (next: DormHandbook, file: File | null) => void;
  onClose: () => void;
}) {
  const formId = `${useId()}-handbook`;
  const [edition, setEdition] = useState(handbook.edition);
  const [pages, setPages] = useState(String(handbook.pages));
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Choose the handbook PDF to upload.");
      return;
    }
    if (file && file.size > MAX_BYTES) {
      setError(`${file.name} is larger than 50 MiB.`);
      return;
    }
    onSave({
      ...handbook,
      edition: edition.trim(),
      pages: Number(pages) || 0,
      updatedAt: formatToday(),
      fileName: file ? file.name : handbook.fileName,
      pdfUrl: file ? "/api/dorm/handbook" : handbook.pdfUrl,
    }, file);
  }

  return (
    <ActionDialog
      open
      onOpenChange={() => {}}
      title="Update handbook"
      description="There is only one handbook. Uploading replaces the current version."
      actionLabel="Save"
      actionType="submit"
      actionForm={formId}
      isActionDisabled={!edition.trim()}
      onCancel={onClose}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <FormError message={error} />
        <Field label="Edition" htmlFor={`${formId}-edition`}>
          <Input
            id={`${formId}-edition`}
            value={edition}
            onChange={(event) => setEdition(event.target.value)}
            required
            maxLength={80}
          />
        </Field>
        <Field label="Pages" htmlFor={`${formId}-pages`}>
          <Input
            id={`${formId}-pages`}
            type="number"
            min={1}
            value={pages}
            onChange={(event) => setPages(event.target.value)}
          />
        </Field>
        <Field
          label="PDF file"
          htmlFor={`${formId}-file`}
          hint={
            handbook.fileName
              ? `Current file: ${handbook.fileName}. Leave empty to keep it.`
              : "No file uploaded yet."
          }
        >
          <input
            id={`${formId}-file`}
            type="file"
            accept="application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className={FILE_CLASS}
          />
        </Field>
      </form>
    </ActionDialog>
  );
}

/** Add or edit a rule's title and text. */
export function RuleDialog({
  rule,
  onSave,
  onClose,
}: {
  rule: DormRule | null;
  onSave: (next: DormRule) => void;
  onClose: () => void;
}) {
  const formId = `${useId()}-rule`;
  const [title, setTitle] = useState(rule?.title ?? "");
  const [body, setBody] = useState(rule?.body ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) {
      setError("Enter the rule text.");
      return;
    }
    onSave({
      id: rule?.id ?? newId(),
      title: title.trim(),
      body: body.trim(),
      updatedAt: formatToday(),
    });
  }

  return (
    <ActionDialog
      open
      onOpenChange={() => {}}
      title={rule ? "Edit rule" : "Add rule"}
      actionLabel="Save"
      actionType="submit"
      actionForm={formId}
      isActionDisabled={!title.trim()}
      onCancel={onClose}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <FormError message={error} />
        <Field label="Title" htmlFor={`${formId}-title`}>
          <Input
            id={`${formId}-title`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={120}
          />
        </Field>
        <Field label="Text" htmlFor={`${formId}-body`}>
          <textarea
            id={`${formId}-body`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className={TEXTAREA_CLASS}
          />
        </Field>
      </form>
    </ActionDialog>
  );
}
