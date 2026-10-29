"use client";

// Dev-only preview: renders the dormitory page with the real navbar but without
// the (app) layout's login check, so no Supabase session is needed. The switch
// at the bottom toggles between the admin and the student view.
// Delete this file before merging.
import { useState } from "react";

import { DormitoryView } from "@/components/dormitory/dormitory-view";
import { Navbar } from "@/components/navbar";

export default function DormitoryPreviewPage() {
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">
        <DormitoryView isAdmin={isAdmin} />
      </div>

      <button
        type="button"
        onClick={() => setIsAdmin((value) => !value)}
        className="fixed right-4 bottom-24 z-40 rounded-full bg-black-1 px-4 py-2 text-xs font-semibold text-white shadow-lg md:bottom-6"
      >
        Viewing as: {isAdmin ? "Admin" : "User"} (tap to switch)
      </button>

      {/* clears the fixed mobile bottom tab bar */}
      <div className="h-16 md:hidden" aria-hidden />
    </div>
  );
}
