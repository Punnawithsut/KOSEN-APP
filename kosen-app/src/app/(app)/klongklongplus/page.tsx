import Link from "next/link";
import { ClipboardList, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EquipmentCard } from "@/components/equipmentCard";
import { isAdmin } from "@/lib/auth/role";

export default async function ModulesExamplePage() {
  const admin = await isAdmin();

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-black-1">Equipments</h1>

      <div className="flex flex-col gap-4">
        <EquipmentCard
          width={200}
          height={100}
          titleText="Calculator"
          image="/images/calculator-thumb.jpg"
          destination="/klongklongplus/calculators"
          description="Scientific calculators for exams and classwork"
          extendedInfo="Borrow a scientific calculator for class or an exam. Please return it the same day you borrow it, since demand is highest during exam weeks."
        />

        <EquipmentCard
          width={200}
          height={100}
          titleText="Charger"
          image="/images/charger-thumb.jpg"
          destination="/klongklongplus/chargers"
          description="Phone and laptop charging cables"
          extendedInfo="A selection of USB-C, Lightning, and laptop charging cables are available. Check availability before heading over — popular cables run out fast."
          badgeText="Popular"
        />
      </div>

      {/* floating action button */}
      <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-3 md:bottom-6">
        {admin && (
          <Button
            asChild
            className="h-12 gap-2 rounded-full bg-orange-secondary px-5 text-sm font-semibold text-white shadow-lg hover:brightness-90 md:bottom-6"
          >
            <Link href="/klongklongplus/admin">
              <Lock className="size-5" />
              Admin
            </Link>
          </Button>
        )}
        <Button
          asChild
          className="h-12 gap-2 rounded-full bg-orange-secondary px-5 text-sm font-semibold text-white shadow-lg hover:brightness-90 md:bottom-6"
        >
          <Link href="/klongklongplus/my-requests">
            <ClipboardList className="size-5" />
            My Request
          </Link>
        </Button>
      </div>
    </div>
  );
}
