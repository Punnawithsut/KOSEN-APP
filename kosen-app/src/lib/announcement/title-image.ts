/** Widths the title-image route will serve. Anything else falls back to 800. */
export const TITLE_IMAGE_WIDTHS = [400, 800, 1600] as const;

/** What the detail view needs to render a banner. */
export type TitleImage = {
  src: string;
  srcSet?: string;
  sizes?: string;
};

/**
 * Stable, same-origin URL for an announcement's banner.
 *
 * Deliberately NOT the signed Supabase URL the API returns. `createSignedUrl`
 * mints a fresh token on every request, so those URLs change on every list
 * fetch and the browser can never cache a single one of them — every visit
 * re-downloaded every thumbnail. This path is stable, so it caches, and it is
 * served through our own route so the image can be resized for the slot it
 * lands in.
 */
export function titleImageSrc(announcementId: string, width: number): string {
  return `/api/announcement/${announcementId}/title-image?w=${width}`;
}

export function titleImageSrcSet(announcementId: string): string {
  return TITLE_IMAGE_WIDTHS.map(
    (width) => `${titleImageSrc(announcementId, width)} ${width}w`,
  ).join(", ");
}
