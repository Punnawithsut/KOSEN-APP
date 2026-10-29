import { notFound } from "next/navigation";
import AnnouncementDetailClient from "./announcement-detail-view";
import { fetchAnnouncement } from "@/app/api/announcement/announcement.service";
import type { ApiResponse } from "@/lib/api/types";
import type { AnnouncementDetailData } from "@/lib/announcement/types";

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let initialAnnouncement: ApiResponse<AnnouncementDetailData> | undefined =
    undefined;

  try {
    const rawAnnouncement = await fetchAnnouncement(id);
    if (!rawAnnouncement) {
      notFound();
    }

    initialAnnouncement = {
      ok: true,
      data: {
        ...rawAnnouncement,
        year: rawAnnouncement.year as number | "all",
        createdAt:
          rawAnnouncement.createdAt instanceof Date
            ? rawAnnouncement.createdAt.toISOString()
            : String(rawAnnouncement.createdAt),
        updatedAt:
          rawAnnouncement.updatedAt instanceof Date
            ? rawAnnouncement.updatedAt.toISOString()
            : String(rawAnnouncement.updatedAt),
      },
    };
  } catch (error) {
    console.error(
      `[SSR Prefetch] Failed to prefetch announcement ${id}:`,
      error,
    );
  }

  return <AnnouncementDetailClient initialAnnouncement={initialAnnouncement} />;
}
