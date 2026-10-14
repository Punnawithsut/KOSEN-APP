import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EquipmentCard } from "@/components/equipmentCard";

export default function ModulesExamplePage() {
  return (
    <div className="relative mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-black-1">Equipments</h1>

      <div className="flex flex-col gap-4">
        <EquipmentCard
          width={200}
          height={100}
          titleText="Umbrellas"
          image="/images/umbrella-thumb.jpg"
          destination="/klongplus/umbrella"
          description="Borrow an umbrella for rainy days"
          extendedInfo="A limited number of umbrellas are available to borrow at the front desk. Return within 24 hours so the next person can use one too."
          badgeText="3 new"
        />

        <EquipmentCard
          width={200}
          height={100}
          titleText="Calculator"
          image="/images/calculator-thumb.jpg"
          destination="/klongplus/calculator"
          description="Scientific calculators for exams and classwork"
          extendedInfo="Borrow a scientific calculator for class or an exam. Please return it the same day you borrow it, since demand is highest during exam weeks."
        />

        <EquipmentCard
          width={200}
          height={100}
          titleText="Charger"
          image="/images/charger-thumb.jpg"
          destination="/klongplus/charger"
          description="Phone and laptop charging cables"
          extendedInfo="A selection of USB-C, Lightning, and laptop charging cables are available. Check availability before heading over — popular cables run out fast."
          badgeText="Popular"
        />
      </div>

      {/* floating action button */}
      <Button
        asChild
        className="fixed bottom-24 right-6 z-40 h-12 gap-2 rounded-full bg-orange-secondary px-5 text-sm font-semibold text-white shadow-lg hover:brightness-90 md:bottom-6"
      >
        <Link href="/klongklongplus/my-requests">
          <ClipboardList className="size-5" />
          My Request
        </Link>
      </Button>
    </div>
  );
}