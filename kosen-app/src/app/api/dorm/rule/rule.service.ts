import { BadRequestError, NotFoundError } from "../../_shared/errors";
import { parsePageQuery } from "../../_shared/pagination";
import {
  createRule as insertRule,
  getRuleById,
  listRules as queryRules,
  softDeleteRuleById,
  type RuleFilters,
  type RuleUpdateData,
  updateRuleById,
  PAGE_SIZE,
} from "./rule.repo";

function parseObjectBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new BadRequestError("JSON body must be an object.");
  }
  return body as Record<string, unknown>;
}

function validateRuleId(id: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    throw new BadRequestError("Rule ID must be a valid UUID.");
  }
}

function parseRequiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new BadRequestError(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

function parseOptionalText(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new BadRequestError("Field must be a string.");
  }
  return value.trim() || null;
}

function parseOptionalInteger(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new BadRequestError("point_deduction must be an integer.");
  }
  return value;
}

export function parseListQuery(searchParams: URLSearchParams) {
  const page = parsePageQuery(searchParams, {
    pageSize: PAGE_SIZE,
    required: true,
  });

  const filters: RuleFilters = {};
  const searchName = searchParams.get("searchName")?.trim();
  if (searchName) filters.searchName = searchName;

  return { page, filters };
}

export async function listRules(page: number, filters: RuleFilters) {
  const { items, total } = await queryRules(filters, page);
  return {
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      rule_description: item.rule_description,
      penalty_description: item.penalty_description,
      point_deduction: item.point_deduction,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,
    })),
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  };
}

export async function fetchRule(id: string) {
  validateRuleId(id);
  const rule = await getRuleById(id);
  if (!rule) throw new NotFoundError("Rule not found.");
  return {
    id: rule.id,
    name: rule.name,
    rule_description: rule.rule_description,
    penalty_description: rule.penalty_description,
    point_deduction: rule.point_deduction,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
    deletedAt: rule.deletedAt,
  };
}

export async function createRule(body: unknown) {
  const payload = parseObjectBody(body);
  const name = parseRequiredText(payload.name, "Name");
  const rule_description = parseOptionalText(payload.rule_description);
  const penalty_description = parseOptionalText(payload.penalty_description);
  const point_deduction = parseOptionalInteger(payload.point_deduction);

  const created = await insertRule({
    name,
    rule_description,
    penalty_description,
    point_deduction,
  });

  if (!created) {
    throw new NotFoundError("Failed to create rule.");
  }

  return {
    id: created.id,
    name: created.name,
    rule_description: created.rule_description,
    penalty_description: created.penalty_description,
    point_deduction: created.point_deduction,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
    deletedAt: created.deletedAt,
  };
}

export async function modifyRule(id: string, body: unknown) {
  validateRuleId(id);
  const payload = parseObjectBody(body);
  const data: RuleUpdateData = {};

  if ("name" in payload) data.name = parseRequiredText(payload.name, "Name");
  if ("rule_description" in payload)
    data.rule_description = parseOptionalText(payload.rule_description);
  if ("penalty_description" in payload)
    data.penalty_description = parseOptionalText(payload.penalty_description);
  if ("point_deduction" in payload)
    data.point_deduction = parseOptionalInteger(payload.point_deduction);

  if (Object.keys(data).length === 0) {
    throw new BadRequestError("No valid update fields provided.");
  }

  const result = await updateRuleById(id, data);
  if (!result) throw new NotFoundError("Rule not found.");

  return {
    id: result.id,
    name: result.name,
    rule_description: result.rule_description,
    penalty_description: result.penalty_description,
    point_deduction: result.point_deduction,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    deletedAt: result.deletedAt,
  };
}

export async function removeRule(id: string) {
  validateRuleId(id);
  if (!(await softDeleteRuleById(id))) {
    throw new NotFoundError("Rule not found.");
  }
}
