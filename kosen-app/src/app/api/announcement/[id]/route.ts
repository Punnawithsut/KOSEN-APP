import { NextResponse } from "next/server";
import {
  useAdminMiddleware as withAdminMiddleware,
  withSessionMiddleware,
} from "../../_shared/middleware";
import * as announcementService from "../announcement.service";

type AnnouncementParams = { id: string };

export const GET = withSessionMiddleware<AnnouncementParams>(
  async (_req, { params }) => {
    const announcement = await announcementService.fetchAnnouncement(params.id);
    return NextResponse.json({ ok: true, data: announcement });
  },
);

export const PUT = withAdminMiddleware<AnnouncementParams>(
  async (req, { params }) => {
    const { fields, files, replaceFiles } =
      await announcementService.parseAnnouncementFormData(req);
    const announcement = await announcementService.modifyAnnouncement(
      params.id,
      fields,
      files,
      replaceFiles,
    );
    return NextResponse.json({
      ok: true,
      message: "Announcement updated successfully",
      data: announcement,
    });
  },
);

export const DELETE = withAdminMiddleware<AnnouncementParams>(
  async (_req, { params }) => {
    await announcementService.removeAnnouncement(params.id);
    return NextResponse.json({
      ok: true,
      message: "Announcement deleted successfully",
    });
  },
);
