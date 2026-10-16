// TODO: remove before merge — dev-only preview route.
//
// The real screen lives at /announcement inside the (app) route group, whose
// layout wraps everything in <RequireStandalone>. That redirects to "/" unless
// the app is running as an installed PWA, which makes iterating painful.
//
// This route renders the exact same component with no gate, so you can develop
// it in a normal browser tab at http://localhost:3000/announcement-dev
import AnnouncementPage from "@/app/(app)/announcement/page";
import { Navbar } from "@/components/navbar";

export default function AnnouncementDevPage() {
  return (
    <>
      {/* Same fixed h-16 bar the (app) layout renders, so the hero's
          `100vh - 4rem` height matches production. */}
      <Navbar />
      <AnnouncementPage />
    </>
  );
}
