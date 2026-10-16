"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { AnnouncementDetailView } from "@/components/announcement/announcement-detail-view";
import { Button } from "@/components/ui/button";
import { useAnnouncement } from "@/hooks/use-announcement";
import { describeAnnouncementError } from "@/lib/announcement/errors";
import { splitAnnouncementFiles } from "@/lib/announcement/types";

/** Announcement detail screen — banner, body, attachments, gallery. */
export default function AnnouncementDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : null;
  const { announcement, isLoading, error, refetch } = useAnnouncement(id);

  const backButton = (
    <Link
      href="/announcement"
      aria-label="Back to announcements"
      className="flex size-9 items-center justify-center rounded-full bg-orange-primary text-white transition-colors hover:bg-orange-secondary"
    >
      <ArrowLeftIcon className="size-5" />
    </Link>
  );

  if (id === null || isLoading) {
    return (
      <div className="mx-auto w-full max-w-[430px] px-4 pt-3 pb-8 md:max-w-3xl md:px-6">
        <div aria-busy className="animate-pulse space-y-4">
          <div className="size-9 rounded-full bg-black-5" />
          <div className="aspect-[16/9] w-full rounded-2xl bg-blue-subtle-3" />
          <div className="h-4 w-2/3 rounded bg-black-5" />
          <div className="h-3 w-full rounded bg-black-6" />
          <div className="h-3 w-5/6 rounded bg-black-6" />
        </div>
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="mx-auto w-full max-w-[430px] px-4 pt-3 pb-8 md:max-w-3xl md:px-6">
        <div
          role="alert"
          className="rounded-2xl bg-noti-negative-subtle p-4 text-sm text-black-2"
        >
          <p>
            {error
              ? describeAnnouncementError(error)
              : "That announcement no longer exists."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              void refetch();
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const { images, attachments } = splitAnnouncementFiles(announcement.files);

  return (
    <div className="mx-auto w-full max-w-[430px] px-4 pt-3 pb-8 md:max-w-3xl md:px-6">
      <AnnouncementDetailView
        name={announcement.name}
        description={announcement.description}
        titleImageUrl={announcement.titleImageUrl}
        images={images}
        attachments={attachments}
        bannerOverlay={backButton}
      />
    </div>
  );
}
