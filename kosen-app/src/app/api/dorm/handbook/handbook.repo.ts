import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { dormHandbooks } from "@/db/schema";

export async function getHandbookMetadata() {
  const [item] = await db.select().from(dormHandbooks).orderBy(desc(dormHandbooks.createdAt)).limit(1);
  return item ? { title: item.title, edition: item.edition, pages: item.pages, fileName: item.fileName, updatedAt: item.createdAt.toISOString(), pdfUrl: "/api/dorm/handbook" } : null;
}

export async function getCurrentHandbook() {
  const [item] = await db.select().from(dormHandbooks).orderBy(desc(dormHandbooks.createdAt)).limit(1);
  return item ?? null;
}

export async function replaceHandbookRecord(input: { edition: string; pages: number; fileName: string; storagePath: string; createdBy: string }) {
  return db.transaction(async (tx) => {
    await tx.delete(dormHandbooks);
    const [row] = await tx.insert(dormHandbooks).values(input).returning();
    return row;
  });
}

