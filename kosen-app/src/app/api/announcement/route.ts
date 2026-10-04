import { NextResponse } from "next/server";
import {
  useAdminMiddleware as withAdminMiddleware,
  withSessionMiddleware,
} from "../_shared/middleware";
import * as announcementService from "./announcement.service";

export const GET = withSessionMiddleware(async (req) => {
  const { page, filters } = announcementService.parseListQuery(
    req.nextUrl.searchParams,
  );
  const data = await announcementService.listAnnouncements(page, filters);
  return NextResponse.json({ ok: true, data });
});

export const POST = withAdminMiddleware(async (req, { user }) => {
  const { fields, files } =
    await announcementService.parseAnnouncementFormData(req);
  const announcement = await announcementService.createAnnouncement(
    user.id,
    fields,
    files,
  );
  return NextResponse.json(
    {
      ok: true,
      message: "Announcement created successfully",
      data: announcement,
    },
    { status: 201 },
  );
});
