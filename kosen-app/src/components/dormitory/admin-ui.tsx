"use client";

import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const FIELD_CLASS =
  "h-9 w-full rounded-xl border border-black-5 bg-white px-3 text-sm text-black-1 outline-none focus-visible:border-blue-primary focus-visible:ring-2 focus-visible:ring-blue-subtle-1";

export const TEXTAREA_CLASS =
  "min-h-24 w-full rounded-xl border border-black-5 bg-white px-3 py-2 text-sm text-black-1 outline-none focus-visible:border-blue-primary focus-visible:ring-2 focus-visible:ring-blue-subtle-1";

export const FILE_CLASS =
  "block w-full text-xs text-black-3 file:mr-3 file:rounded-full file:border-0 file:bg-orange-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white";

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-xs font-medium text-black-2"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-black-4">{hint}</p> : null}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  return message ? (
    <p
      role="alert"
      className="rounded-xl bg-noti-negative-subtle px-3 py-2 text-xs text-black-2"
    >
      {message}
    </p>
  ) : null;
}

/** Small pencil button overlaid on a card; admins only. */
export function EditButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-black-2 shadow-sm ring-1 ring-black-5 transition-colors hover:bg-black-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-secondary",
        className,
      )}
    >
      <PencilIcon className="size-3" />
    </button>
  );
}

export function DeleteButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-red-600 shadow-sm ring-1 ring-black-5 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600",
        className,
      )}
    >
      <Trash2Icon className="size-3" />
    </button>
  );
}

export function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 w-fit items-center gap-1.5 rounded-full border border-dashed border-blue-secondary px-4 text-xs font-semibold text-blue-secondary transition-colors hover:bg-blue-subtle-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-secondary"
    >
      <PlusIcon className="size-4" />
      {label}
    </button>
  );
}
