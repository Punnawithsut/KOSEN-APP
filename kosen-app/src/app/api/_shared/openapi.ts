export const openApiSpec = {
  openapi: "3.0.0",
  info: { title: "KOSEN API", version: "1.0.0" },
  paths: {
    "/api/profile": {
      get: {
        summary: "Retrieve user profile by ID",
        responses: { 200: { description: "Success" } },
      },
      patch: {
        summary: "Update user profile by ID",
        responses: { 200: { description: "Updated" } },
      },
    },
  },
};