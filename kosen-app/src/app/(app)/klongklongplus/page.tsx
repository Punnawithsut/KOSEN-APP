import { EquipmentCard } from "@/components/equipmentCard";

export default function ModulesExamplePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-black-1">Equipments</h1>

      <div className="flex flex-col gap-4">
        <EquipmentCard
          width={200}
          height={100}
          titleText="Announcements"
          image="/images/announcements-thumb.jpg"
          destination="/announcements"
          description="Campus news, events, and official notices"
          extendedInfo="Stay up to date with everything from the student council — scholarship deadlines, event sign-ups, and school-wide notices, filtered to your year and department."
          badgeText="3 new"
        />

        <EquipmentCard
          width={200}
          height={100}
          titleText="Dormitory"
          image="/images/dormitory-thumb.jpg"
          destination="/dormitory"
          description="Room info, building details, and dorm points"
          extendedInfo="View your assigned building and room, check your current dorm point balance, and see the history of any point changes recorded by staff."
        />

        <EquipmentCard
          width={200}
          height={100}
          titleText="Klong+ Box"
          image="/images/klongplus-thumb.jpg"
          destination="/klongplus"
          description="Borrow calculators, cables, and other shared items"
          extendedInfo="Browse what's currently available to borrow, request an item, and keep track of what you still need to return before the due date."
          badgeText="Popular"
        />
      </div>
    </div>
  );
}