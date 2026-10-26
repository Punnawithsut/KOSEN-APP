import AnnouncementDetailPage from "./announcement-detail-view";
import { fetchAnnouncement } from "@/app/api/announcement/announcement.service";
import { AnnouncementDetailData, ApiResponse } from "@/lib/announcement/types";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  let initialAnnouncement: ApiResponse<AnnouncementDetailData> | undefined = undefined;

  if (id) {
    try {
      const announcement = await fetchAnnouncement(id);
      initialAnnouncement = {
        ok: true,
        data: announcement as unknown as AnnouncementDetailData,
      };
    } catch (error) {
      console.error(`[SSR Prefetch] Failed to fetch announcement ${id}:`, error);
    }
  }

  return <AnnouncementDetailPage initialAnnouncement={initialAnnouncement} />;
}