import { profileDocs } from "../profile/profile.swagger";

export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "KOSEN API Documentation",
    version: "1.0.0",
  },
  tags: [
    { name: "Profile", description: "Profile management endpoints" },
    // Add new module tags here later (e.g. Announcements)
  ],
  paths: {
    ...profileDocs,
    // ...announcementDocs,
  },
};
