export const dormDocs = {
  "/api/dorm/forms": {
    get: {
      tags: ["Dorm Forms"],
      summary: "List dorm forms",
      parameters: [
        {
          name: "page",
          in: "query",
          required: true,
          schema: { type: "integer", minimum: 1 },
        },
        {
          name: "searchName",
          in: "query",
          required: false,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Dorm forms and pagination metadata" },
        400: { description: "Invalid pagination parameters" },
        401: { description: "Unauthorized" },
      },
    },
    post: {
      tags: ["Dorm Forms"],
      summary: "Create a dorm form",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name"],
              properties: {
                name: { type: "string", example: "Dorm Application Form" },
                description: {
                  type: "string",
                  example: "Please submit your dorm application by the due date.",
                },
                formsURL: {
                  type: "string",
                  format: "uri",
                  example: "https://example.com/dorm-application-form.pdf",
                },
                dueDate: {
                  type: "string",
                  format: "date-time",
                  example: "2026-11-30T23:59:00+07:00",
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
  "/api/dorm/forms/{id}": {
    get: {
      tags: ["Dorm Forms"],
      summary: "Get a dorm form",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: { description: "Dorm form details" },
        401: { description: "Unauthorized" },
        404: { description: "Form not found" },
      },
    },
    put: {
      tags: ["Dorm Forms"],
      summary: "Update a dorm form",
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
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                formsURL: { type: "string", format: "uri" },
                dueDate: { type: "string", format: "date-time" },
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
        404: { description: "Form not found" },
      },
    },
    delete: {
      tags: ["Dorm Forms"],
      summary: "Soft-delete a dorm form",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: { description: "Soft-deleted successfully" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
        404: { description: "Form not found" },
      },
    },
  },
  "/api/dorm/dormwardens": {
    get: {
      tags: ["Dorm Wardens"],
      summary: "List dorm wardens",
      parameters: [
        {
          name: "page",
          in: "query",
          required: true,
          schema: { type: "integer", minimum: 1 },
        },
        {
          name: "searchName",
          in: "query",
          required: false,
          schema: { type: "string" },
        },
        {
          name: "officeDay",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ],
          },
        },
      ],
      responses: {
        200: { description: "Dorm wardens and pagination metadata" },
        400: { description: "Invalid pagination parameters" },
        401: { description: "Unauthorized" },
      },
    },
    post: {
      tags: ["Dorm Wardens"],
      summary: "Create a dorm warden",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "officeDay", "officeStartTime", "officeEndTime"],
              properties: {
                name: { type: "string", example: "Ajarn Somchai" },
                lineID: { type: "string", example: "somchai_line" },
                phone: { type: "string", example: "0812345678" },
                role: {
                  type: "string",
                  example: "Educator",
                  default: "Educator",
                },
                officeDay: {
                  type: "string",
                  enum: [
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                    "sunday",
                  ],
                },
                officeStartTime: {
                  type: "string",
                  example: "08:30:00",
                },
                officeEndTime: {
                  type: "string",
                  example: "16:30:00",
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
  "/api/dorm/dormwardens/{id}": {
    get: {
      tags: ["Dorm Wardens"],
      summary: "Get a dorm warden",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: { description: "Dorm warden details" },
        401: { description: "Unauthorized" },
        404: { description: "Warden not found" },
      },
    },
    put: {
      tags: ["Dorm Wardens"],
      summary: "Update a dorm warden",
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
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                lineID: { type: "string" },
                phone: { type: "string" },
                role: { type: "string" },
                officeDay: {
                  type: "string",
                  enum: [
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                    "sunday",
                  ],
                },
                officeStartTime: { type: "string" },
                officeEndTime: { type: "string" },
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
        404: { description: "Warden not found" },
      },
    },
    delete: {
      tags: ["Dorm Wardens"],
      summary: "Soft-delete a dorm warden",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: { description: "Soft-deleted successfully" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
        404: { description: "Warden not found" },
      },
    },
  },
  "/api/dorm/handbook": {
    get: {
      tags: ["Dorm Handbook"],
      summary: "Download dorm handbook PDF",
      description:
        "Downloads the dorm handbook PDF from the steady DORM_HANDBOOK_URL.",
      responses: {
        200: {
          description: "Handbook PDF file",
          content: {
            "application/pdf": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
        401: { description: "Unauthorized" },
        500: { description: "DORM_HANDBOOK_URL is not configured" },
        502: { description: "Unable to fetch the handbook file" },
      },
    },
  },
};
