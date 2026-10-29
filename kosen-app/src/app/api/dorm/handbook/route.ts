import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { useAdminMiddleware as withAdmin, withSessionMiddleware } from "../../_shared/middleware";
import { BadRequestError } from "../../_shared/errors";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHandbook, replaceHandbookRecord } from "./handbook.repo";

const BUCKET = "dorm-files";
const MAX_SIZE = 50 * 1024 * 1024;

export const GET = withSessionMiddleware(async (request) => {
  const current = await getCurrentHandbook();
  if (!current) return NextResponse.json({ ok: false, error: "Handbook not found." }, { status: 404 });
  const supabase = await createClient();
  const downloadName = request.nextUrl.searchParams.get("download") === "1" ? current.fileName : undefined;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(current.storagePath, 60 * 60, downloadName ? { download: downloadName } : undefined);
  if (error || !data?.signedUrl) return NextResponse.json({ ok: false, error: "Unable to access handbook." }, { status: 502 });
  return NextResponse.redirect(data.signedUrl);
});

export const POST = withAdmin(async (request, { user }) => {
  const form = await request.formData();
  const file = form.get("file");
  const edition = form.get("edition");
  const pages = Number(form.get("pages"));
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_SIZE || (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))) throw new BadRequestError("Upload a PDF file smaller than 50 MiB.");
  if (typeof edition !== "string" || !edition.trim() || edition.length > 80) throw new BadRequestError("Edition is required (maximum 80 characters).");
  if (!Number.isInteger(pages) || pages < 1) throw new BadRequestError("Pages must be a positive integer.");

  const supabase = await createClient();
  const old = await getCurrentHandbook();
  const storagePath = `handbook/${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, { contentType: "application/pdf", upsert: false });
  if (error) return NextResponse.json({ ok: false, error: "Handbook upload failed." }, { status: 502 });
  try {
    await replaceHandbookRecord({ edition: edition.trim(), pages, fileName: file.name, storagePath, createdBy: user.id });
  } catch (error) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw error;
  }
  if (old) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([old.storagePath]);
    if (removeError) console.error("Unable to remove replaced handbook object:", removeError);
  }
  return NextResponse.json({ ok: true, data: { edition: edition.trim(), pages, fileName: file.name, pdfUrl: "/api/dorm/handbook" } });
});
