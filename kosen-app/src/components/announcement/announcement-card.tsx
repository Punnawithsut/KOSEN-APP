import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

import type { Announcement } from "@/lib/announcement/types";

/** Formats an ISO timestamp as dd/mm/yy, matching the design's "post on …". */
function formatPostDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

type AnnouncementCardProps = {
  announcement: Announcement;
  /** Admin-only. Leave both out and the plain student card renders. */
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (announcement: Announcement) => void;
};

/**
 * Fluid hit area for the admin icons, on the same vw scale as the rest of the
 * card. Plain buttons rather than `Button` so no variant class has to be
 * overridden — with fluid sizing, overriding `size-8` would come down to
 * which utility the stylesheet happens to emit last.
 */
const ICON_BUTTON_CLASS =
  "grid size-[clamp(1.75rem,1.98vw,2.375rem)] shrink-0 place-items-center rounded-full transition-colors";

const ICON_CLASS = "size-[clamp(0.875rem,1.04vw,1.25rem)]";

/**
 * Fluid card scale, calibrated against the Figma desktop frame.
 *
 * In Figma the frame is **1920 wide and one card is 1522 x 381** (79.3% of the
 * frame), with an image ~41% of the card at roughly 8:5. Every size below is
 * the design's 1920 value written as `vw`, clamped at both ends:
 *
 *   element      @1920   clamp()
 *   title        32px    clamp(14px, 1.667vw, 32px)   <- 14px = phone design
 *   description  25px    clamp(11px, 1.302vw, 25px)   <- 11px = phone design
 *   "post on"     16px    clamp(10px, 0.833vw, 16px)
 *   "more"        18px    clamp(11px, 0.938vw, 18px)
 *
 * The lower bound is the 390-wide phone frame so small screens still match
 * that design; the upper bound stops anything growing past 1920. Between the
 * two the whole card scales with the viewport, so the proportions stay put.
 */
const THUMBNAIL_CLASS =
  "aspect-[4/3] w-[45%] shrink-0 rounded-[clamp(0.75rem,1vw,1.5rem)] bg-blue-subtle-2 object-cover lg:aspect-[5/3] lg:w-[41%]";

/** Presentation only — takes data as props, holds no state. */
export function AnnouncementCard({
  announcement,
  onEdit,
  onDelete,
}: AnnouncementCardProps) {
  return (
    <article className="flex items-center gap-[clamp(0.75rem,2vw,2.5rem)] border-b border-black-5 py-3 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 className="line-clamp-2 text-[clamp(0.875rem,1.667vw,2rem)] leading-[1.3] font-bold text-black-1">
          {announcement.name}
        </h2>

        <p className="mt-[0.45em] line-clamp-2 text-[clamp(0.6875rem,1.302vw,1.5625rem)] leading-[1.45] text-black-3">
          {announcement.description}
        </p>

        <p className="mt-[0.5em] text-[clamp(0.625rem,0.833vw,1rem)] text-black-4">
          post on {formatPostDate(announcement.createdAt)}
        </p>

        <div className="mt-[0.8em] flex items-center gap-2 self-start">
          <Link
            href={`/announcement/${announcement.id}`}
            className="rounded-full bg-orange-primary px-[1.4em] py-[0.35em] text-[clamp(0.6875rem,0.938vw,1.125rem)] font-medium text-white transition-colors hover:bg-orange-secondary"
          >
            more
          </Link>

          {onEdit ? (
            <button
              type="button"
              aria-label={`Edit ${announcement.name}`}
              onClick={() => onEdit(announcement)}
              className={`${ICON_BUTTON_CLASS} text-black-3 hover:bg-black-6 hover:text-black-1`}
            >
              <Pencil className={ICON_CLASS} />
            </button>
          ) : null}

          {onDelete ? (
            <button
              type="button"
              aria-label={`Delete ${announcement.name}`}
              onClick={() => onDelete(announcement)}
              className={`${ICON_BUTTON_CLASS} text-destructive hover:bg-destructive/10`}
            >
              <Trash2 className={ICON_CLASS} />
            </button>
          ) : null}
        </div>
      </div>

      {/* The card image comes from the announcement's TITLE image, not from
          `files`. `files` feeds the detail screen's attachment chips and
          gallery; the list deliberately shows the banner instead. */}
      {announcement.titleImageUrl ? (
        // Plain <img>: these are short-lived signed Supabase URLs, so
        // next/image optimisation (and the remotePatterns config it needs)
        // is not a good fit here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={announcement.titleImageUrl}
          alt=""
          loading="lazy"
          className={THUMBNAIL_CLASS}
        />
      ) : (
        <div aria-hidden className={THUMBNAIL_CLASS} />
      )}
    </article>
  );
}
