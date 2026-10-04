import { and, count, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { db } from "@/db/client";
import {
  announcementAttachments,
  announcementCategoryEnum,
  announcements,
} from "@/db/schema";

export type AnnouncementType =
  (typeof announcementCategoryEnum.enumValues)[number];

export type AnnouncementFile = {
  storagePath: string;
  type: string;
};

export type AnnouncementUpdateData = {
  name?: string;
  description?: string;
  year?: number | null;
  department?: string | null;
  type?: AnnouncementType | null;
  files?: AnnouncementFile[];
};

export type AnnouncementFilters = {
  searchName?: string;
  searchYear?: number;
  searchDepartment?: string;
  searchType?: AnnouncementType;
};

function buildAnnouncementWhere(filters: AnnouncementFilters) {
  return and(
    eq(announcements.isPublished, true),
    filters.searchName
      ? ilike(announcements.title, `%${filters.searchName}%`)
      : undefined,
    filters.searchYear !== undefined
      ? or(
          isNull(announcements.targetYear),
          eq(announcements.targetYear, filters.searchYear),
        )
      : undefined,
    filters.searchDepartment
      ? or(
          isNull(announcements.targetDepartment),
          eq(announcements.targetDepartment, filters.searchDepartment),
        )
      : undefined,
    filters.searchType
      ? or(
          isNull(announcements.category),
          eq(announcements.category, filters.searchType),
        )
      : undefined,
  );
}

export async function listAnnouncements(
  filters: AnnouncementFilters,
  page: number,
) {
  const where = buildAnnouncementWhere(filters);
  const offset = (page - 1) * 5;

  const [items, [{ total }]] = await Promise.all([
    db.query.announcements.findMany({
      where,
      with: { attachments: true },
      orderBy: [desc(announcements.createdAt)],
      limit: 5,
      offset,
    }),
    db.select({ total: count() }).from(announcements).where(where),
  ]);

  return { items, total };
}

export async function getAnnouncementById(id: string) {
  return db.query.announcements.findFirst({
    where: and(eq(announcements.id, id), eq(announcements.isPublished, true)),
    with: { attachments: true },
  });
}

export async function createAnnouncement(
  announcementId: string,
  authorId: string,
  data: AnnouncementUpdateData,
) {
  const [created] = await db.transaction(async (tx) => {
    const [announcement] = await tx
      .insert(announcements)
      .values({
        id: announcementId,
        title: data.name!,
        content: data.description!,
        targetYear: data.year ?? null,
        targetDepartment: data.department ?? null,
        category: data.type ?? null,
        authorId,
      })
      .returning({ id: announcements.id });

    if (data.files?.length) {
      await tx.insert(announcementAttachments).values(
        data.files.map((file, displayOrder) => ({
          announcementId: announcement.id,
          fileUrl: null,
          storagePath: file.storagePath,
          fileType: file.type,
          displayOrder,
        })),
      );
    }

    return [
      await tx.query.announcements.findFirst({
        where: eq(announcements.id, announcement.id),
        with: { attachments: true },
      }),
    ];
  });

  return created;
}

export async function updateAnnouncementById(
  id: string,
  data: AnnouncementUpdateData,
) {
  const updated = await db.transaction(async (tx) => {
    const previousStoragePaths =
      data.files === undefined
        ? []
        : (
            await tx
              .select({ storagePath: announcementAttachments.storagePath })
              .from(announcementAttachments)
              .where(eq(announcementAttachments.announcementId, id))
          )
            .map((file) => file.storagePath)
            .filter(
              (storagePath): storagePath is string => storagePath !== null,
            );

    const updateData: {
      title?: string;
      content?: string;
      targetYear?: number | null;
      targetDepartment?: string | null;
      category?: AnnouncementType | null;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (data.name !== undefined) updateData.title = data.name;
    if (data.description !== undefined) updateData.content = data.description;
    if (data.year !== undefined) updateData.targetYear = data.year;
    if (data.department !== undefined)
      updateData.targetDepartment = data.department;
    if (data.type !== undefined) updateData.category = data.type;

    const [existing] = await tx
      .update(announcements)
      .set(updateData)
      .where(eq(announcements.id, id))
      .returning({ id: announcements.id });

    if (!existing) return null;

    if (data.files !== undefined) {
      await tx
        .delete(announcementAttachments)
        .where(eq(announcementAttachments.announcementId, id));

      if (data.files.length) {
        await tx.insert(announcementAttachments).values(
          data.files.map((file, displayOrder) => ({
            announcementId: id,
            fileUrl: null,
            storagePath: file.storagePath,
            fileType: file.type,
            displayOrder,
          })),
        );
      }
    }

    return {
      announcement: await tx.query.announcements.findFirst({
        where: eq(announcements.id, id),
        with: { attachments: true },
      }),
      removedStoragePaths: previousStoragePaths,
    };
  });

  return updated;
}

export async function getAnnouncementForAdminById(id: string) {
  return db.query.announcements.findFirst({
    where: eq(announcements.id, id),
    with: { attachments: true },
  });
}

export async function deleteAnnouncementById(id: string) {
  const [deleted] = await db
    .delete(announcements)
    .where(eq(announcements.id, id))
    .returning({ id: announcements.id });

  return Boolean(deleted);
}
