import { NextResponse } from "next/server";
import {
  useAdminMiddleware as withAdminMiddleware,
  withSessionMiddleware,
} from "../../../_shared/middleware";
import * as ruleService from "../rule.service";

type RuleParams = { id: string };

export const GET = withSessionMiddleware<RuleParams>(
  async (_req, { params }) => {
    const rule = await ruleService.fetchRule(params.id);
    return NextResponse.json({ ok: true, data: rule });
  },
);

export const PUT = withAdminMiddleware<RuleParams>(
  async (req, { params }) => {
    const rule = await ruleService.modifyRule(params.id, await req.json());
    return NextResponse.json({
      ok: true,
      message: "Rule updated successfully",
      data: rule,
    });
  },
);

export const DELETE = withAdminMiddleware<RuleParams>(
  async (_req, { params }) => {
    await ruleService.removeRule(params.id);
    return NextResponse.json({
      ok: true,
      message: "Rule soft-deleted successfully",
    });
  },
);
