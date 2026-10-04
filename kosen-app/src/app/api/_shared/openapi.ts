import { profileDocs } from "../profile/profile.swagger";
import { announcementDocs } from "../announcement/announcement.swagger";

export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "KOSEN API Documentation",
    version: "1.0.0",
  },
  tags: [
    { name: "Profile", description: "Profile management endpoints" },
    { name: "Announcements", description: "Announcement management endpoints" },
  ],
  paths: {
    ...profileDocs,
    ...announcementDocs,
  },
};
