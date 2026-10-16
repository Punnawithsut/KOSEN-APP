import Link from "next/link";

import type { Announcement, AnnouncementFile } from "@/lib/announcement/types";

/** Formats an ISO timestamp as dd/mm/yy, matching the design's "post on …". */
function formatPostDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

/**
 * The design shows exactly one thumbnail per card: the first attachment by
 * `displayOrder` that actually has a resolved URL.
 */
function pickThumbnail(files: AnnouncementFile[]): AnnouncementFile | null {
  const ordered = [...files].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );
  return ordered.find((file) => Boolean(file.url)) ?? null;
}

type AnnouncementCardProps = {
  announcement: Announcement;
};

/** Presentation only — takes data as props, holds no state. */
export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const thumbnail = pickThumbnail(announcement.files);

  return (
    <article className="flex gap-3 rounded-2xl bg-blue-subtle-3 p-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 className="line-clamp-2 text-sm font-semibold text-black-1">
          {announcement.name}
        </h2>

        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-black-3">
          {announcement.description}
        </p>

        <p className="mt-2 text-[11px] text-orange-secondary">
          post on {formatPostDate(announcement.createdAt)}
        </p>

        <Link
          href={`/announcement/${announcement.id}`}
          className="mt-2 self-start rounded-full bg-orange-primary px-3 py-0.5 text-[11px] font-medium text-white transition-colors hover:bg-orange-secondary"
        >
          more
        </Link>
      </div>

      {thumbnail?.url ? (
        // Plain <img>: these are short-lived signed Supabase URLs, so
        // next/image optimisation (and the remotePatterns config it needs)
        // is not a good fit here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail.url}
          alt=""
          loading="lazy"
          className="size-24 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="size-24 shrink-0 rounded-xl bg-blue-subtle-2"
        />
      )}
    </article>
  );
}
