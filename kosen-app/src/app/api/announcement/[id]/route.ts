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
  async (req, { params, user }) => {
    const { fields, files, replaceFiles, titleImage } =
      await announcementService.parseAnnouncementFormData(req);
    const announcement = await announcementService.modifyAnnouncement(
      params.id,
      user.id,
      fields,
      files,
      replaceFiles,
      titleImage,
    );
    return NextResponse.json({
      ok: true,
      message: "Announcement updated successfully",
      data: announcement,
    });
  },
);

export const DELETE = withAdminMiddleware<AnnouncementParams>(
  async (_req, { params, user }) => {
    await announcementService.removeAnnouncement(params.id, user.id);
    return NextResponse.json({
      ok: true,
      message: "Announcement soft-deleted successfully",
    });
  },
);
