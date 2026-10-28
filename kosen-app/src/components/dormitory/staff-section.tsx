import Image from "next/image";
import { MessageCircleIcon, PhoneIcon, UserIcon } from "lucide-react";

import type { DormStaff } from "@/lib/dormitory/data";

const CONTACT_BASE =
  "flex items-center gap-3 rounded-lg bg-blue-subtle-2 px-4 py-3 text-sm font-semibold text-blue-secondary";

/** Renders a tappable link when the value is a real number, plain text otherwise. */
function ContactRow({
  icon,
  value,
  href,
}: {
  icon: React.ReactNode;
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

export function StaffSection({ staff }: { staff: DormStaff[] }) {
  return (
    <section aria-labelledby="staff-heading" className="flex flex-col gap-3">
      <h2 id="staff-heading" className="font-display text-3xl text-black-1 md:text-4xl">
        Contact Staff
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((person) => {
          const digits = person.phone.replace(/\D/g, "");
          const hasPhone = digits.length >= 9;
          return (
            <li key={person.id} className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-2xl font-semibold text-black-1">{person.name}</h3>
                  <p className="mt-1 text-xs text-black-3">• {person.role}</p>
                  <p className="mt-4 text-xs font-medium text-black-2">Office hour</p>
                  <ul className="mt-1 text-xs text-black-2">
                    {person.officeHours.map((hours) => (
                      <li key={hours}>• {hours}</li>
                    ))}
                  </ul>
                </div>
                {person.photo ? (
                  <Image
                    src={person.photo}
                    alt={person.name}
                    width={80}
                    height={80}
                    className="size-20 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-black-5 text-black-4"
                  >
                    <UserIcon className="size-12" />
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <ContactRow
                  icon={<PhoneIcon className="size-5" />}
                  value={person.phone}
                  href={hasPhone ? `tel:${digits}` : null}
                />
                <ContactRow
                  icon={<MessageCircleIcon className="size-5" />}
                  value={person.lineId}
                  href={null}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
