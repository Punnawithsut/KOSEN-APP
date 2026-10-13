import { profileDocs } from "../profile/profile.swagger";
import { announcementDocs } from "../announcement/announcement.swagger";
import { loansDocs } from "../klongklongplus/loans/swagger";
import { unitsDocs } from "../klongklongplus/units/swagger";

export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "KOSEN API Documentation",
    version: "1.0.0",
  },
  tags: [
    { name: "Profile", description: "Profile management endpoints" },
    { name: "Announcements", description: "Announcement management endpoints" },
    { name: "Loans", description: "Klong Klong Plus loan management endpoints" },
    { name: "Units", description: "Klong Klong Plus inventory unit endpoints" },
  ],
  paths: {
    ...profileDocs,
    ...announcementDocs,
    ...loansDocs,
    ...unitsDocs,
  },
};
