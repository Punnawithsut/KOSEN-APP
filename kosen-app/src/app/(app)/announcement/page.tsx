import { createClient } from "@/lib/supabase/server";
import AnnouncementPage from "./announcement-view";
import { buildAnnouncementQuery } from "@/hooks/use-announcements";
import { EMPTY_FILTERS, AnnouncementListData, ApiResponse } from "@/lib/announcement/types";

export default async function Page() {
  let initialAnnouncements: ApiResponse<AnnouncementListData> | undefined = undefined;
  let initialProfile = undefined;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { fetchUserProfile } = await import("@/app/api/profile/profile.service");
      const userProfile = await fetchUserProfile(user.id);
      if (userProfile) {
        initialProfile = { data: userProfile };
      }

      const query = buildAnnouncementQuery(1, EMPTY_FILTERS);
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/announcement?${query}`, {
        headers: {
          cookie: (await import("next/headers")).cookies().toString(),
        },
        cache: "no-store",
      });

      if (res.ok) {
        initialAnnouncements = await res.json();
      }
    }
  } catch (error) {
    console.error("[SSR Prefetch] Failed to prefetch announcements:", error);
  }

  return (
    <AnnouncementPage 
      initialAnnouncements={initialAnnouncements} 
      initialProfile={initialProfile} 
    />
  );
}