import { randomUUID } from "node:crypto";
import { BadRequestError, NotFoundError } from "../../_shared/errors";
import { FORM_ICON_KEYS, type FormIconKey } from "@/lib/dormitory/data";
// import { parsePageQuery } from "../../_shared/pagination";
import {
  createForm as insertForm,
  getFormById,
  listForms as queryForms,
  softDeleteFormById,
  type FormFilters,
  type FormUpdateData,
  updateFormById,
  // PAGE_SIZE,
} from "./forms.repo";

function parseObjectBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new BadRequestError("JSON body must be an object.");
  }
  return body as Record<string, unknown>;
}

function validateFormId(id: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    throw new BadRequestError("Form ID must be a valid UUID.");
  }
}

function parseRequiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new BadRequestError(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

function parseOptionalDate(value: unknown): Date | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new BadRequestError("dueDate must be a string (ISO 8601).");
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestError("dueDate must be a valid ISO 8601 timestamp.");
  }
  return parsed;
}

function parseOptionalUrl(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new BadRequestError("formsURL must be a string.");
  }
  try {
    new URL(value.trim());
  } catch {
    throw new BadRequestError("formsURL must be a valid URL.");
  }
  return value.trim() || null;
}

function parseFormIcon(value: unknown): FormIconKey {
  if (typeof value !== "string" || !FORM_ICON_KEYS.includes(value as FormIconKey)) {
    throw new BadRequestError("icon must be a supported form icon.");
  }
  return value as FormIconKey;
}

export function parseListQuery(searchParams: URLSearchParams) { //Seems useful but based on frontend ref it will not be used
  // const page =  parsePageQuery(searchParams, { //maybe redundant
  //   pageSize: PAGE_SIZE,
  //   required: true,
  // });

  const filters: FormFilters = {};
  const searchName = searchParams.get("searchName")?.trim();
  if (searchName) filters.searchName = searchName;

  // return { page, filters };
  return { filters };
}

export async function listForms(filters: FormFilters /*, page: number*/) {
  const { items /*, total*/ } = await queryForms(filters /*, page*/);
  return {
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      icon: item.icon,
      dueDate: item.dueDate,
      formsURL: item.formsURL,
      createdBy: item.createdBy,
      updatedBy: item.updatedBy,
      deletedBy: item.deletedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,
    })),
    // pagination: { //Again, probably wouldn't be used based on frontend ref.
    //   page,
    //   pageSize: PAGE_SIZE,
    //   total,
    //   totalPages: Math.ceil(total / PAGE_SIZE),
    // },
  };
}

export async function fetchForm(id: string) {
  validateFormId(id);
  const form = await getFormById(id);
  if (!form) throw new NotFoundError("Form not found.");
  return {
    id: form.id,
    name: form.name,
    description: form.description,
    icon: form.icon,
    dueDate: form.dueDate,
    formsURL: form.formsURL,
    createdBy: form.createdBy,
    updatedBy: form.updatedBy,
    deletedBy: form.deletedBy,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
    deletedAt: form.deletedAt,
  };
}

export async function createForm(createdBy: string, body: unknown) {
  const payload = parseObjectBody(body);
  const name = parseRequiredText(payload.name, "Name");
  const description =
    typeof payload.description === "string" ? payload.description : null;
  const icon = payload.icon === undefined ? "document" : parseFormIcon(payload.icon);
  const dueDate = parseOptionalDate(payload.dueDate);
  const formsURL = parseOptionalUrl(payload.formsURL);
  const formId = randomUUID();

  return await insertForm(formId, createdBy, {
    name,
    description,
    icon,
    dueDate,
    formsURL,
  }).then(
    (created) => {
      if (!created) {
        throw new NotFoundError("Failed to create form.");
      }
      return {
        id: created.id,
        name: created.name,
        description: created.description,
        icon: created.icon,
        dueDate: created.dueDate,
        formsURL: created.formsURL,
        createdBy: created.createdBy,
        updatedBy: created.updatedBy,
        deletedBy: created.deletedBy,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        deletedAt: created.deletedAt,
      };
    },
  );
}

export async function modifyForm(
  id: string,
  updatedBy: string,
  body: unknown,
) {
  validateFormId(id);
  const payload = parseObjectBody(body);
  const data: FormUpdateData = {};

  if ("name" in payload) data.name = parseRequiredText(payload.name, "Name");
  if ("description" in payload)
    data.description =
      typeof payload.description === "string" ? payload.description : null;
  if ("icon" in payload) data.icon = parseFormIcon(payload.icon);
  if ("dueDate" in payload) data.dueDate = parseOptionalDate(payload.dueDate);
  if ("formsURL" in payload) data.formsURL = parseOptionalUrl(payload.formsURL);

  if (Object.keys(data).length === 0) { 
    throw new BadRequestError("No valid update fields provided.");
  }

  const result = await updateFormById(id, updatedBy, data);
  if (!result) throw new NotFoundError("Form not found.");

  return {
    id: result.id,
    name: result.name,
    description: result.description,
    icon: result.icon,
    dueDate: result.dueDate,
    formsURL: result.formsURL,
    createdBy: result.createdBy,
    updatedBy: result.updatedBy,
    deletedBy: result.deletedBy,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    deletedAt: result.deletedAt,
  };
}

export async function removeForm(id: string, deletedBy: string) {
  validateFormId(id);
  if (!(await softDeleteFormById(id, deletedBy))) {
    throw new NotFoundError("Form not found.");
  }
}
