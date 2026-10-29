import { randomUUID } from "node:crypto";
import { AppError } from "../_shared/errors";
import { createClient } from "@/lib/supabase/server";

const BUCKET_NAME = "announcement-files";

export type StoredAnnouncementFile = {
  storagePath: string;
  type: string;
};

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "file";
}

export async function uploadAnnouncementFiles(
  announcementId: string,
  files: File[],
): Promise<StoredAnnouncementFile[]> {
  const supabase = await createClient();
  const bucket = supabase.storage.from(BUCKET_NAME);
  const uploaded: StoredAnnouncementFile[] = [];

  try {
    for (const file of files) {
      const storagePath = `${announcementId}/${randomUUID()}-${safeFileName(file.name)}`;
      const fileType = file.type || "application/octet-stream";
      const { error } = await bucket.upload(storagePath, file, {
        contentType: fileType,
        upsert: false,
      });

      if (error) {
        console.error("Supabase announcement file upload failed:", error);
        throw new AppError(
          "Failed to upload announcement file to Supabase Storage.",
          502,
        );
      }

      uploaded.push({
        storagePath,
        type: fileType,
      });
    }
  } catch (error) {
    await removeAnnouncementFiles(
      uploaded.map((file) => file.storagePath),
    ).catch((cleanupError) =>
      console.error(
        "Failed to clean up uploaded announcement files:",
        cleanupError,
      ),
    );
    throw error;
  }

  return uploaded;
}

export async function uploadAnnouncementTitleImage(
  announcementId: string,
  file: File,
) {
  const storagePath = `${announcementId}/title/${randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await (
    await createClient()
  ).storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Supabase announcement title image upload failed:", error);
    throw new AppError(
      "Failed to upload announcement title image to Supabase Storage.",
      502,
    );
  }

  return storagePath;
}

export async function getAnnouncementFileUrl(storagePath: string) {
  const { data, error } = await (
    await createClient()
  ).storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, 60 * 60);

  if (error || !data?.signedUrl) {
    throw new AppError(
      "Failed to generate announcement file URL from Supabase Storage.",
      502,
    );
  }

  return data.signedUrl;
}

/**
 * Signs many objects in a single Storage request.
 *
 * `createSignedUrl` is one HTTP round trip per object, so resolving a banner
 * plus ten attachments cost eleven of them — all of it blocking the detail
 * response. `createSignedUrls` batches the whole set into one call.
 *
 * An object that fails to sign is logged and left out of the map rather than
 * failing the request: one unreadable attachment should not blank the page.
 */
export async function getAnnouncementFileUrls(
  storagePaths: string[],
  expiresIn = 60 * 60,
): Promise<Map<string, string>> {
  const uniquePaths = [...new Set(storagePaths)];
  if (uniquePaths.length === 0) return new Map();

  const { data, error } = await (
    await createClient()
  ).storage
    .from(BUCKET_NAME)
    .createSignedUrls(uniquePaths, expiresIn);

  if (error || !data) {
    throw new AppError(
      "Failed to generate announcement file URLs from Supabase Storage.",
      502,
    );
  }

  const urls = new Map<string, string>();

  data.forEach((entry, index) => {
    const path = entry.path || uniquePaths[index];

    if (entry.error || !entry.signedUrl || !path) {
      console.error("Failed to sign announcement file:", {
        path,
        error: entry.error,
      });
      return;
    }

    urls.set(path, entry.signedUrl);
  });

  return urls;
}

/**
 * Pulls an object back out of the private bucket.
 *
 * Used by the title-image route, which has to read the original before it can
 * resize it. Returns the bytes and the stored content type, because the caller
 * decides whether the format is one it can re-encode.
 */
export async function downloadAnnouncementFile(storagePath: string) {
  const { data, error } = await (
    await createClient()
  ).storage
    .from(BUCKET_NAME)
    .download(storagePath);

  if (error || !data) {
    console.error("Supabase announcement file download failed:", error);
    throw new AppError(
      "Failed to download the announcement file from Supabase Storage.",
      502,
    );
  }

  return {
    data: Buffer.from(await data.arrayBuffer()),
    contentType: data.type || "application/octet-stream",
  };
}

export async function removeAnnouncementFiles(storagePaths: string[]) {
  if (storagePaths.length === 0) return;

  const { error } = await (
    await createClient()
  ).storage
    .from(BUCKET_NAME)
    .remove(storagePaths);

  if (error) {
    throw new AppError(
      "Failed to remove announcement files from Supabase Storage.",
      502,
    );
  }
}
