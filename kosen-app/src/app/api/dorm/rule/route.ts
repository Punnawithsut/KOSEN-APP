import { NextResponse } from "next/server";
import {
  useAdminMiddleware as withAdminMiddleware,
  withSessionMiddleware,
} from "../../_shared/middleware";
import * as ruleService from "./rule.service";

export const GET = withSessionMiddleware(async (req) => {
  const { page, filters } = ruleService.parseListQuery(
    req.nextUrl.searchParams,
  );
  const data = await ruleService.listRules(page, filters);
  return NextResponse.json({ ok: true, data });
});

export const POST = withAdminMiddleware(async (req, { user }) => {
  const created = await ruleService.createRule(await req.json());
  return NextResponse.json(
    {
      ok: true,
      message: "Rule created successfully",
      data: created,
    },
    { status: 201 },
  );
});
