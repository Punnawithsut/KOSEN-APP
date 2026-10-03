export const announcementDocs = {
  "/api/announcement": {
    get: {
      tags: ["Announcements"],
      summary: "List announcements",
      parameters: [
        {
          name: "page",
          in: "query",
          required: true,
          schema: { type: "integer", minimum: 1 },
        },
        ...["searchName", "searchYear", "searchDepartment", "searchType"].map(
          (name) => ({
            name,
            in: "query",
            required: false,
            schema: { type: "string" },
          }),
        ),
      ],
      responses: {
        200: { description: "Announcements and pagination metadata" },
        400: { description: "Invalid pagination or search parameters" },
        401: { description: "Unauthorized" },
      },
    },
    post: {
      tags: ["Announcements"],
      summary: "Create an announcement",
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["name", "description"],
              properties: {
                name: { type: "string", example: "Campus update" },
                description: {
                  type: "string",
                  example: "Announcement details",
                },
                year: {
                  oneOf: [
                    { type: "integer", minimum: 1, maximum: 5 },
                    { type: "string", enum: ["all"] },
                  ],
                  default: "all",
                },
                department: {
                  type: "string",
                  enum: [
                    "all",
                    "Computer Engineering",
                    "Mechanical Engineering",
                    "Electrical and Electronics Engineering",
                  ],
                  default: "all",
                },
                type: {
                  type: "string",
                  enum: ["all", "for_you", "news", "events"],
                  default: "all",
                },
                files: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                  description: "Files to upload to Supabase Storage",
                },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Created successfully" },
        400: { description: "Validation error" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
      },
    },
  },
  "/api/announcement/{id}": {
    get: {
      tags: ["Announcements"],
      summary: "Get an announcement",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: { description: "Announcement details" },
        401: { description: "Unauthorized" },
        404: { description: "Announcement not found" },
      },
    },
    put: {
      tags: ["Announcements"],
      summary: "Update an announcement",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                year: {
                  oneOf: [
                    { type: "integer", minimum: 1, maximum: 5 },
                    { type: "string", enum: ["all"] },
                  ],
                },
                department: {
                  type: "string",
                  enum: [
                    "all",
                    "Computer Engineering",
                    "Mechanical Engineering",
                    "Electrical and Electronics Engineering",
                  ],
                },
                type: {
                  type: "string",
                  enum: ["all", "for_you", "news", "events"],
                },
                files: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                  description: "Replacing files uploaded to Supabase Storage",
                },
                clearFiles: {
                  type: "boolean",
                  description: "Set true to remove all existing attachments",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Updated successfully" },
        400: { description: "Validation error" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
        404: { description: "Announcement not found" },
      },
    },
    delete: {
      tags: ["Announcements"],
      summary: "Delete an announcement",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: { description: "Deleted successfully" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
        404: { description: "Announcement not found" },
      },
    },
  },
};
