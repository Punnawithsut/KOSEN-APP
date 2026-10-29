import { BadRequestError, AppError, NotFoundError } from "../../_shared/errors";
import { createClient } from "@/lib/supabase/server";
import { getWardenById } from "./dormwardens.repo";

const BUCKET = "dorm-files";
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function photoPath(id: string) {
  if (!UUID.test(id)) throw new BadRequestError("Warden ID must be a valid UUID.");
  return `staff/${id}/photo`;
}

export async function uploadWardenPhoto(id: string, value: FormDataEntryValue | null) {
  const path = photoPath(id);
  if (!(value instanceof File) || !value.size || value.size > MAX_SIZE || !ALLOWED_TYPES.has(value.type)) {
    throw new BadRequestError("Upload a JPEG, PNG, WebP, or GIF image smaller than 5 MiB.");
  }
  if (!(await getWardenById(id))) throw new NotFoundError("Staff contact not found.");
  const { error } = await (await createClient()).storage.from(BUCKET).upload(path, value, {
    contentType: value.type,
    upsert: true,
  });
  if (error) {
    console.error("Supabase staff photo upload failed:", error);
    throw new AppError("Staff photo upload failed.", 502);
  }
}

export async function getWardenPhotoUrl(id: string) {
  const path = photoPath(id);
  const { data, error } = await (await createClient()).storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) throw new NotFoundError("Staff photo not found.");
  return data.signedUrl;
}

export async function removeWardenPhoto(id: string) {
  const path = photoPath(id);
  const { error } = await (await createClient()).storage.from(BUCKET).remove([path]);
  if (error) throw new AppError("Staff photo deletion failed.", 502);
}
