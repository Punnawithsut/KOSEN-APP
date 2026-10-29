import { and, desc, eq, isNull, ilike } from "drizzle-orm";
import { db } from "@/db/client";
import { forms } from "@/db/schema";

/**
 * Rows per page for the dorm forms list.
 */
// export const PAGE_SIZE = 10;

export type FormFilters = {
  searchName?: string;
};

export type FormUpdateData = {
  name?: string;
  description?: string | null;
  dueDate?: Date | null;
  formsURL?: string | null;
};

function buildFormWhere(filters: FormFilters) {
  return and(
    isNull(forms.deletedAt), //form exists
    filters.searchName ? ilike(forms.name, `%${filters.searchName}%`) : undefined,
  );
}

export async function listForms(filters: FormFilters /*, page: number*/) {
  const where = buildFormWhere(filters);
  // const offset = (page - 1) * PAGE_SIZE;

  const [items /*, [{ total }]*/] = await Promise.all([
    db
      .select()
      .from(forms)
      .where(where)
      .orderBy(desc(forms.createdAt))
      // .limit(PAGE_SIZE)
      // .offset(offset),
    // db.select({ total: count() }).from(forms).where(where),
  ]);

  return { items /*, total*/ };
}

export async function getFormById(id: string) {
  return db.query.forms.findFirst({
    where: and(eq(forms.id, id), isNull(forms.deletedAt)),
    with: {
      createdByUser: true,
      updatedByUser: true,
      deletedByUser: true,
    },
  });
}

export async function createForm(
  formId: string,
  createdBy: string,
  data: FormUpdateData,
) {
  const [created] = await db.transaction(async (tx) => {
    const [form] = await tx
      .insert(forms)
      .values({
        id: formId,
        name: data.name!,
        description: data.description ?? null,
        dueDate: data.dueDate ?? null,
        formsURL: data.formsURL ?? null,
        createdBy,
      })
      .returning();

    return [
      await tx.query.forms.findFirst({
        where: eq(forms.id, form.id),
        with: {
          createdByUser: true,
          updatedByUser: true,
          deletedByUser: true,
        },
      }),
    ];
  });

  return created;
}

export async function updateFormById(
  id: string,
  updatedBy: string,
  data: FormUpdateData,
) {
  const updatedAt = new Date();
  const [existing] = await db
    .update(forms)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
      ...(data.formsURL !== undefined && { formsURL: data.formsURL }),
      updatedBy,
      updatedAt,
    })
    .where(and(eq(forms.id, id), isNull(forms.deletedAt)))
    .returning({ id: forms.id });

  if (!existing) return null;

  return await db.query.forms.findFirst({
    where: eq(forms.id, id),
    with: {
      createdByUser: true,
      updatedByUser: true,
      deletedByUser: true,
    },
  });
}

export async function softDeleteFormById(id: string, deletedBy: string) {
  const deletedAt = new Date();
  const [deleted] = await db
    .update(forms)
    .set({ deletedAt, deletedBy, updatedAt: deletedAt, updatedBy: deletedBy })
    .where(and(eq(forms.id, id), isNull(forms.deletedAt)))
    .returning({ id: forms.id });

  return Boolean(deleted);
}
