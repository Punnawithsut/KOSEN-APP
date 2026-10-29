import { randomUUID } from "node:crypto";
import { AppError, BadRequestError, NotFoundError } from "../../_shared/errors";
import { createClient } from "@/lib/supabase/server";
import { deleteHandbookRecord, getCurrentHandbook, replaceHandbookRecord } from "./handbook.repo";

const BUCKET = "dorm-files";
const MAX_SIZE = 50 * 1024 * 1024;

export async function getHandbookUrl(download: boolean) {
  const current = await getCurrentHandbook();
  if (!current) throw new NotFoundError("Handbook not found.");
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(
    current.storagePath,
    60 * 60,
    download ? { download: current.fileName } : undefined,
  );
  if (error || !data?.signedUrl) throw new AppError("Unable to access handbook.", 502);
  return data.signedUrl;
}

export async function replaceHandbook(file: FormDataEntryValue | null, edition: FormDataEntryValue | null, pagesValue: FormDataEntryValue | null, userId: string) {
  const pages = typeof pagesValue === "string" ? Number(pagesValue) : Number.NaN;
  if (!(file instanceof File) || !file.size || file.size > MAX_SIZE || (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))) throw new BadRequestError("Upload a PDF file smaller than 50 MiB.");
  if (typeof edition !== "string" || !edition.trim() || edition.length > 80) throw new BadRequestError("Edition is required (maximum 80 characters).");
  if (!Number.isInteger(pages) || pages < 1) throw new BadRequestError("Pages must be a positive integer.");

  const supabase = await createClient();
  const old = await getCurrentHandbook();
  const storagePath = `handbook/${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, { contentType: "application/pdf", upsert: false });
  if (error) throw new AppError("Handbook upload failed.", 502);
  try {
    await replaceHandbookRecord({ edition: edition.trim(), pages, fileName: file.name, storagePath, createdBy: userId });
  } catch (error) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw error;
  }
  if (old) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([old.storagePath]);
    if (removeError) console.error("Unable to remove replaced handbook object:", removeError);
  }
  return { title: "Dormitory Handbook", edition: edition.trim(), pages, fileName: file.name, pdfUrl: "/api/dorm/handbook" };
}

export async function removeHandbook() {
  const current = await getCurrentHandbook();
  if (!current) throw new NotFoundError("Handbook not found.");
  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([current.storagePath]);
  if (error) throw new AppError("Handbook file deletion failed.", 502);
  if (!(await deleteHandbookRecord(current.id))) throw new NotFoundError("Handbook not found.");
}
