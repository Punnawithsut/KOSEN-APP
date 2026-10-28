"use client";

import { DormitoryView } from "@/components/dormitory/dormitory-view";
import { useMyProfile } from "@/hooks/use-profile";

export default function DormitoryPage() {
  const { data: profileResponse } = useMyProfile();
  const isAdmin = profileResponse?.data?.role === "admin";

  return <DormitoryView isAdmin={isAdmin} />;
}
