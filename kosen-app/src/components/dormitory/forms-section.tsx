"use client";

import { GaugeIcon, TableIcon, WrenchIcon, type LucideIcon } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import type { DormForm } from "@/lib/dormitory/data";

const ICONS: Record<DormForm["icon"], LucideIcon> = {
  maintenance: WrenchIcon,
  transfer: TableIcon,
  meter: GaugeIcon,
};

const DAY_MS = 86_400_000;

/** Badge text + colour for a form's deadline. */
function dueBadge(closesAt: string | null): { label: string; className: string } {
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

export function FormsSection({ forms }: { forms: DormForm[] }) {
  const { toast } = useToast();

  function open(form: DormForm) {
    if (!form.url) {
      toast({
        title: "Form not available yet",
        description: "This form has not been published. Please check back later.",
        variant: "error",
      });
      return;
    }
    window.open(form.url, "_blank", "noopener,noreferrer");
  }

  return (
    <section aria-labelledby="forms-heading" className="flex flex-col gap-3">
      <div>
        <h2 id="forms-heading" className="font-display text-3xl text-black-1 md:text-4xl">
          Forms
        </h2>
        <p className="text-sm text-black-3">
          Tap one to open it in Google Forms. Sign in with your @kmitl.ac.th account.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {forms.map((form) => {
          const Icon = ICONS[form.icon];
          const badge = dueBadge(form.closesAt);
          return (
            <li key={form.id}>
              <button
                type="button"
                onClick={() => open(form)}
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
            </li>
          );
        })}
      </ul>
    </section>
  );
}
