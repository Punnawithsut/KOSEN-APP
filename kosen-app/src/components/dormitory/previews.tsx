"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import {
  CalendarClockIcon,
  ExternalLinkIcon,
  PhoneIcon,
  UserIcon,
} from "lucide-react";

import { FORM_ICONS } from "@/components/dormitory/form-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  STAFF_POSITIONS,
  type DormForm,
  type DormStaff,
} from "@/lib/dormitory/data";
import { formatOfficeHour } from "@/lib/dormitory/utils";

const DAY_MS = 86_400_000;

/** Badge text + colour for a form's deadline. */
export function dueBadge(closesAt: string | null): {
  label: string;
  className: string;
} {
  if (!closesAt) {
    return { label: "no due date", className: "bg-blue-subtle-2 text-blue-secondary" };
  }
  const days = Math.ceil((new Date(closesAt).getTime() - Date.now()) / DAY_MS);
  if (days < 0) {
    return { label: "Closed", className: "bg-black-6 text-black-3" };
  }
  if (days <= 3) {
    const label = days <= 0 ? "Closes today" : `Closes in ${days} day${days === 1 ? "" : "s"}`;
    return { label, className: "bg-noti-negative-subtle text-negative-primary" };
  }
  return { label: `Closes in ${days} days`, className: "bg-noti-warning-subtle text-black-2" };
}

/** LINE has no lucide icon, so draw its recognisable green badge. */
export function LineBadge() {
  return (
    <span
      aria-label="LINE"
      className="flex h-5 w-9 shrink-0 items-center justify-center rounded-md bg-[#06C755] text-[10px] leading-none font-extrabold tracking-wide text-white"
    >
      LINE
    </span>
  );
}

const CONTACT_BASE =
  "flex items-center gap-3 rounded-lg bg-blue-subtle-2 px-4 py-3 text-sm font-semibold text-blue-secondary";

/** Renders a tappable link when `href` is set, plain text otherwise. */
export function ContactRow({
  icon,
  value,
  href,
}: {
  icon: ReactNode;
  value: string;
  href: string | null;
}) {
  if (!href) {
    return (
      <div className={CONTACT_BASE}>
        {icon}
        {value}
      </div>
    );
  }
  return (
    <a
      href={href}
      className={`${CONTACT_BASE} transition-colors hover:bg-blue-subtle-1/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-secondary`}
    >
      {icon}
      {value}
    </a>
  );
}

export function FormPreviewDialog({
  form,
  onClose,
}: {
  form: DormForm;
  onClose: () => void;
}) {
  const { Icon } = FORM_ICONS[form.icon];
  const badge = dueBadge(form.closesAt);
  const closed = badge.label === "Closed";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-5 sm:max-w-sm">
        <DialogHeader className="gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-black-6 text-black-2">
            <Icon className="size-5" />
          </span>
          <DialogTitle className="text-lg font-semibold text-black-1">
            {form.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-black-3">
            {form.description || "No description."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3 border-y py-3 text-sm">
          <span className="text-black-3">Due</span>
          <span className="flex items-center gap-2">
            <span className="font-medium text-black-1">
              {form.closesAt
                ? new Date(form.closesAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "No due date"}
            </span>
            {form.closesAt ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}
              >
                {badge.label}
              </span>
            ) : null}
          </span>
        </div>

        {form.url ? (
          <a
            href={form.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-orange-primary px-4 text-sm font-semibold text-white transition-all hover:brightness-95 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-secondary"
          >
            {closed ? "Open anyway" : "Open form"}
            <ExternalLinkIcon className="size-4" />
          </a>
        ) : (
          <p className="rounded-lg bg-black-6 px-4 py-3 text-center text-sm text-black-3">
            This form has not been published yet.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function StaffPreviewDialog({
  person,
  onClose,
}: {
  person: DormStaff;
  onClose: () => void;
}) {
  const digits = person.phone.replace(/\D/g, "");
  const hasPhone = digits.length >= 9;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-md">
        <div className="flex flex-col items-center gap-3 bg-blue-subtle-2 px-6 pt-8 pb-6 text-center">
          {person.photo ? (
            <Image
              src={person.photo}
              alt={person.name}
              width={128}
              height={128}
              unoptimized
              className="size-32 rounded-2xl object-cover shadow-md ring-4 ring-white"
            />
          ) : (
            <span
              aria-hidden
              className="flex size-32 items-center justify-center rounded-2xl bg-white text-black-4 shadow-md"
            >
              <UserIcon className="size-20" />
            </span>
          )}
          <DialogHeader className="items-center">
            <DialogTitle className="text-4xl font-semibold text-black-1">
              {person.nickname || person.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-black-3">
              {person.nickname ? person.name : "Dormitory staff member"}
            </DialogDescription>
          </DialogHeader>
          <span className="rounded-full bg-blue-secondary px-3 py-1 text-xs font-semibold text-white">
            {STAFF_POSITIONS[person.position]}
          </span>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5">
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-black-1">
              <CalendarClockIcon className="size-4 text-blue-secondary" />
              Office hour
            </h3>
            {person.officeHours.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {person.officeHours.map((hour) => {
                  const text = formatOfficeHour(hour);
                  return (
                    <li
                      key={text}
                      className="rounded-lg bg-black-6 px-3 py-1.5 text-xs font-medium text-black-2"
                    >
                      {text}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-black-3">Not set.</p>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-black-1">Contact</h3>
            <ContactRow
              icon={<PhoneIcon className="size-5" />}
              value={person.phone || "—"}
              href={hasPhone ? `tel:${digits}` : null}
            />
            <ContactRow
              icon={<LineBadge />}
              value={person.lineId ? `ID: ${person.lineId}` : "—"}
              href={null}
            />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
