import { createClient } from "@/lib/supabase/server";
import AnnouncementPage from "./announcement-view";
import { listAnnouncements } from "@/app/api/announcement/announcement.service";
import type { ApiResponse } from "@/lib/api/types";
import type { AnnouncementListData } from "@/lib/announcement/types";

export default async function Page() {
  let initialAnnouncements: ApiResponse<AnnouncementListData> | undefined =
    undefined;
  let initialProfile = undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      try {
        const { fetchUserProfile } =
          await import("@/app/api/profile/profile.service");
        const userProfile = await fetchUserProfile(user.id);
        if (userProfile) {
          initialProfile = { data: userProfile };
        }
      } catch (e) {
        console.error("[SSR Prefetch] Failed to prefetch profile:", e);
      }
    }

    const rawAnnouncements = await listAnnouncements(1, {});
    initialAnnouncements = {
      ok: true,
      data: {
        ...rawAnnouncements,
        items: rawAnnouncements.items.map((item) => ({
          ...item,
          createdAt:
            item.createdAt instanceof Date
              ? item.createdAt.toISOString()
              : String(item.createdAt),
        })),
      },
    };
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
