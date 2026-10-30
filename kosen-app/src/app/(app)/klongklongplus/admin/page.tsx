import { EquipmentCard } from "@/components/equipmentCard";
import { requireAdmin } from "@/lib/auth/role";

export default async function AdminPage() {
  await requireAdmin();

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10 sm:px-6 bg-bg-primary">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-black-1">
          Equipment administration
        </h1>
        <p className="text-sm text-black-3">
          Manage loans, terms, and borrowing time slots.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <EquipmentCard
          width={200}
          height={100}
          titleText="Loans"
          image="/icons/icon-192.png"
          destination="/klongklongplus/admin/loans"
          description="Review requests and manage active equipment loans"
          extendedInfo="Filter loans by borrower, status, or unit, then take the next action allowed by the loan’s current status."
        />
        <EquipmentCard
          width={200}
          height={100}
          titleText="Terms"
          image="/icons/icon-192.png"
          destination="/klongklongplus/admin/terms"
          description="Manage academic terms and exam periods"
          extendedInfo="Create, update, and remove terms used to determine borrowing dates and exam periods."
        />
        <EquipmentCard
          width={200}
          height={100}
          titleText="Slots"
          image="/icons/icon-192.png"
          destination="/klongklongplus/admin/slots"
          description="Manage equipment pickup time slots"
          extendedInfo="Set time ranges, advance notice, ordering, and whether a slot is available to borrowers."
        />
      </div>
    </main>
  );
}
