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
