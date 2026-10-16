import type { ReactNode } from "react";
import { FileTextIcon } from "lucide-react";

import { AnnouncementGallery } from "@/components/announcement/announcement-gallery";
import type { ResolvedAnnouncementFile } from "@/lib/announcement/types";

/**
 * Best-effort label for an attachment chip.
 *
 * The API returns no filename — only the resolved URL and the MIME type — so we
 * take the extension off the URL's last path segment and fall back to the MIME
 * subtype (`application/pdf` -> `attachment.pdf`).
 */
export function attachmentLabel(file: ResolvedAnnouncementFile): string {
  try {
    const last = new URL(file.url).pathname.split("/").pop() ?? "";
    if (/\.[a-z0-9]{1,6}$/i.test(last)) return decodeURIComponent(last);
  } catch {
    // Not an absolute URL — fall through to the MIME type.
  }

  const subtype = file.type?.split("/")[1]?.split("+")[0];
  return subtype ? `attachment.${subtype}` : "attachment";
}

type AnnouncementDetailViewProps = {
  name: string;
  description: string;
  titleImageUrl: string | null;
  images: ResolvedAnnouncementFile[];
  attachments: ResolvedAnnouncementFile[];
  /** Sits over the banner's top-left corner — the back button, when there is one. */
  bannerOverlay?: ReactNode;
};

/**
 * The detail screen's body.
 *
 * Shared by `/announcement/[id]` and the admin preview on purpose: a preview
 * that drifts from the real screen is worse than having no preview at all, and
 * one component makes drift impossible. Everything here is presentational —
 * callers do their own splitting via `splitAnnouncementFiles`.
 */
export function AnnouncementDetailView({
  name,
  description,
  titleImageUrl,
  images,
  attachments,
  bannerOverlay,
}: AnnouncementDetailViewProps) {
  return (
    <>
      {/* Banner. Without a `titleImageUrl` we render a tinted band of the SAME
          aspect rather than collapsing the block: the layout then does not jump
          between announcements that have an image and ones that don't, and the
          back button always has a surface to sit on. Same tint the list cards
          use for their no-image placeholder. */}
      <div className="relative">
        {titleImageUrl ? (
          // Plain <img>: these are short-lived signed Supabase URLs (or blob:
          // URLs in the preview), so next/image optimisation is not a fit.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={titleImageUrl}
            alt=""
            className="aspect-[16/9] w-full rounded-2xl object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="aspect-[16/9] w-full rounded-2xl bg-blue-subtle-2"
          />
        )}

        {bannerOverlay ? (
          <div className="absolute top-3 left-3">{bannerOverlay}</div>
        ) : null}
      </div>

      <h1 className="mt-4 text-base font-bold text-black-1 md:text-xl">
        {name}
      </h1>

      {/* `pre-line` keeps the paragraph breaks authors type into the textarea. */}
      <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-black-2 md:text-base">
        {description}
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
    </>
  );
}
