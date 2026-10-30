"use client";

import { useState } from "react";
import Image from "next/image";
import { PhoneIcon, UserIcon } from "lucide-react";

import { AddButton, DeleteButton, EditButton } from "@/components/dormitory/admin-ui";
import { DeleteConfirmDialog } from "@/components/dormitory/delete-confirm-dialog";
import {
  ContactRow,
  LineBadge,
  StaffPreviewDialog,
} from "@/components/dormitory/previews";
import { StaffDialog } from "@/components/dormitory/staff-dialog";
import { useToast } from "@/hooks/use-toast";
import { STAFF_POSITIONS, type DormStaff } from "@/lib/dormitory/data";
import { formatOfficeHour, sortStaff } from "@/lib/dormitory/utils";

export function StaffSection({
  staff,
  isAdmin = false,
  onSave,
  onDelete,
}: {
  staff: DormStaff[];
  isAdmin?: boolean;
  onSave?: (person: DormStaff, photoFile: File | null) => void;
  onDelete?: (person: DormStaff) => Promise<void>;
}) {
  const { toast } = useToast();
  // undefined = closed, null = adding, person = editing.
  const [editing, setEditing] = useState<DormStaff | null | undefined>(undefined);
  const [previewing, setPreviewing] = useState<DormStaff | null>(null);
  const [deleting, setDeleting] = useState<DormStaff | null>(null);

  return (
    <section aria-labelledby="staff-heading" className="flex flex-col gap-3">
      <div>
        <h2 id="staff-heading" className="font-display text-3xl text-black-1 md:text-4xl">
          Contact Staff
        </h2>
        <p className="text-sm text-black-3">
          Reach the people who look after the dormitory. Contact them during
          their office hours, and tap a card to see their full details.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sortStaff(staff).map((person) => {
          const digits = person.phone.replace(/\D/g, "");
          const hasPhone = digits.length >= 9;
          return (
            <li key={person.id} className="relative flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-xs">
              <button
                type="button"
                onClick={() => setPreviewing(person)}
                aria-label={`View details of ${person.name}`}
                className="flex items-start justify-between gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-secondary"
              >
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-black-1">
                    {person.nickname || person.name}
                  </h3>
                  {person.nickname ? (
                    <p className="text-sm text-black-3">{person.name}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-black-3">
                    • {STAFF_POSITIONS[person.position]}
                  </p>
                  <p className="mt-4 text-xs font-medium text-black-2">Office hour</p>
                  <ul className="mt-1 text-xs text-black-2">
                    {person.officeHours.map((hour) => {
                      const text = formatOfficeHour(hour);
                      return <li key={text}>• {text}</li>;
                    })}
                  </ul>
                </div>
                {person.photo ? (
                  <Image
                    src={person.photo}
                    alt={person.name}
                    width={144}
                    height={144}
                    unoptimized
                    className="size-28 shrink-0 rounded-xl object-cover sm:size-32"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex size-28 shrink-0 items-center justify-center rounded-xl bg-black-5 text-black-4 sm:size-32"
                  >
                    <UserIcon className="size-16" />
                  </span>
                )}
              </button>
              <div className="flex flex-col gap-2">
                <ContactRow
                  icon={<PhoneIcon className="size-5" />}
                  value={person.phone}
                  href={hasPhone ? `tel:${digits}` : null}
                />
                <ContactRow
                  icon={<LineBadge />}
                  value={person.lineId ? `ID: ${person.lineId}` : "—"}
                  href={null}
                />
              </div>
              {isAdmin ? (
                <div className="absolute -top-2 -right-2 flex flex-col gap-1">
                  <EditButton label={`Edit ${person.name}`} onClick={() => setEditing(person)} />
                  <DeleteButton label={`Delete ${person.name}`} onClick={() => setDeleting(person)} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {previewing ? (
        <StaffPreviewDialog person={previewing} onClose={() => setPreviewing(null)} />
      ) : null}
      <DeleteConfirmDialog
        open={deleting !== null}
        title="Delete staff contact?"
        description={`“${deleting?.name ?? "This staff contact"}” and all listed office hours will be removed.`}
        itemLabel="Staff contact"
        onCancel={() => setDeleting(null)}
        onDelete={() => deleting && onDelete ? onDelete(deleting) : Promise.reject(new Error("Staff deletion is unavailable."))}
      />
      {isAdmin ? <AddButton label="Add staff" onClick={() => setEditing(null)} /> : null}
      {isAdmin && editing !== undefined ? (
        <StaffDialog
          key={editing?.id ?? "new"}
          person={editing}
          onClose={() => setEditing(undefined)}
          onSave={(next, photoFile) => {
            onSave?.(next, photoFile);
            setEditing(undefined);
            toast({
              title: editing ? "Staff updated" : "Staff added",
              variant: "success",
            });
          }}
        />
      ) : null}
    </section>
  );
}
