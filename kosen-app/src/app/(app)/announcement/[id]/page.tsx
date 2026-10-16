"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeftIcon, FileTextIcon } from "lucide-react";

import { AnnouncementGallery } from "@/components/announcement/announcement-gallery";
import { Button } from "@/components/ui/button";
import { useAnnouncement } from "@/hooks/use-announcement";
import { describeAnnouncementError } from "@/lib/announcement/errors";
import {
  splitAnnouncementFiles,
  type ResolvedAnnouncementFile,
} from "@/lib/announcement/types";

/**
 * Best-effort label for an attachment chip.
 *
 * The API returns no filename — only the resolved URL and the MIME type — so we
 * take the extension off the URL's last path segment and fall back to the MIME
 * subtype (`application/pdf` -> `attachment.pdf`).
 */
function attachmentLabel(file: ResolvedAnnouncementFile): string {
  try {
    const last = new URL(file.url).pathname.split("/").pop() ?? "";
    if (/\.[a-z0-9]{1,6}$/i.test(last)) return decodeURIComponent(last);
  } catch {
    // Not an absolute URL — fall through to the MIME type.
  }

  const subtype = file.type?.split("/")[1]?.split("+")[0];
  return subtype ? `attachment.${subtype}` : "attachment";
}

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
      {/* Banner. Without a `titleImageUrl` we render a tinted band of the SAME
          aspect rather than collapsing the block: the layout then does not jump
          between announcements that have an image and ones that don't, and the
          back button always has a surface to sit on. Same tint the list cards
          use for their no-image placeholder. */}
      <div className="relative">
        {announcement.titleImageUrl ? (
          // Plain <img>: these are short-lived signed Supabase URLs, so
          // next/image optimisation (and its remotePatterns config) is not a
          // good fit here.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={announcement.titleImageUrl}
            alt=""
            className="aspect-[16/9] w-full rounded-2xl object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="aspect-[16/9] w-full rounded-2xl bg-blue-subtle-2"
          />
        )}

        <div className="absolute top-3 left-3">{backButton}</div>
      </div>

      <h1 className="mt-4 text-base font-bold text-black-1 md:text-xl">
        {announcement.name}
      </h1>

      {/* `pre-line` keeps the paragraph breaks authors type into the textarea. */}
      <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-black-2 md:text-base">
        {announcement.description}
      </p>

      {attachments.length > 0 ? (
        <ul className="mt-5 flex flex-wrap gap-2">
          {attachments.map((file) => (
            <li key={file.url}>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-orange-primary px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-orange-secondary"
              >
                <FileTextIcon className="size-3.5 shrink-0" />
                {attachmentLabel(file)}
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {images.length > 0 ? (
        <div className="mt-5">
          <AnnouncementGallery images={images} />
        </div>
      ) : null}
    </div>
  );
}
