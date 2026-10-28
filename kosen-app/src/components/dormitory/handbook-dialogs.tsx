"use client";

import { useId, useState, type FormEvent } from "react";
import { FileTextIcon, XIcon } from "lucide-react";

import { ActionDialog } from "@/components/action-dialog";
import {
  FILE_CLASS,
  Field,
  FormError,
  TEXTAREA_CLASS,
} from "@/components/dormitory/admin-ui";
import { Input } from "@/components/ui/input";
import type {
  DormAttachment,
  DormHandbook,
  DormRule,
} from "@/lib/dormitory/data";
import { formatToday, newId } from "@/lib/dormitory/utils";

const MAX_BYTES = 50 * 1024 * 1024;

/**
 * Replaces the one and only handbook. Leaving the file empty keeps the current
 * PDF, so the edition label can be fixed without re-uploading.
 */
export function HandbookDialog({
  handbook,
  onSave,
  onClose,
}: {
  handbook: DormHandbook;
  onSave: (next: DormHandbook) => void;
  onClose: () => void;
}) {
  const formId = `${useId()}-handbook`;
  const [edition, setEdition] = useState(handbook.edition);
  const [pages, setPages] = useState(String(handbook.pages));
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file && !handbook.pdfUrl) {
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
      pdfUrl: file ? URL.createObjectURL(file) : handbook.pdfUrl,
    });
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

/** Add (`rule` omitted) or edit one rule: title, text and any number of attachments. */
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
  const [attachments, setAttachments] = useState<DormAttachment[]>(
    rule?.attachments ?? [],
  );
  const [error, setError] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    const picked = Array.from(files ?? []);
    const oversized = picked.find((file) => file.size > MAX_BYTES);
    if (oversized) {
      setError(`${oversized.name} is larger than 50 MiB.`);
      return;
    }
    setError(null);
    setAttachments((current) => [
      ...current,
      ...picked.map((file) => ({
        id: newId(),
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
      })),
    ]);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim() && attachments.length === 0) {
      setError("Add some text or at least one attachment.");
      return;
    }
    onSave({
      id: rule?.id ?? newId(),
      title: title.trim(),
      body: body.trim(),
      attachments,
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
        <Field
          label="Attachments"
          htmlFor={`${formId}-files`}
          hint="Images, PDFs or any other file."
        >
          <input
            id={`${formId}-files`}
            type="file"
            multiple
            onChange={(event) => {
              handleFiles(event.target.files);
              event.target.value = "";
            }}
            className={FILE_CLASS}
          />
        </Field>
        {attachments.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {attachments.map((file) => (
              <li
                key={file.id}
                className="flex items-center gap-2 rounded-lg bg-black-6 px-3 py-1.5 text-xs text-black-2"
              >
                <FileTextIcon className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() =>
                    setAttachments((current) =>
                      current.filter((entry) => entry.id !== file.id),
                    )
                  }
                  className="shrink-0 text-black-3 hover:text-black-1"
                >
                  <XIcon className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </form>
    </ActionDialog>
  );
}
