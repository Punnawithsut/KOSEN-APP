export const dormDocs = {
  "/api/dorm/forms": {
    get: {
      tags: ["Dorm Forms"],
      summary: "List dorm forms",
      parameters: [
        {
          name: "searchName",
          in: "query",
          required: false,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "List of dorm forms" },
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
        200: { description: "List of dorm wardens" },
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
        "Downloads the current dorm handbook PDF stored in Supabase Storage.",
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
        404: { description: "No handbook has been uploaded" },
        502: { description: "Unable to access the handbook file" },
      },
    },
  },
  "/api/dorm": {
    get: {
      tags: ["Dorm"],
      summary: "Get aggregate dorm dashboard data",
      description:
        "Returns information of dorm wardens, forms and rules.",
      responses: {
        200: { description: "Aggregate dorm data" },
        401: { description: "Unauthorized" },
      },
    },
  },
  "/api/dorm/rule": {
    get: {
      tags: ["Dorm Rules"],
      summary: "List dorm rules",
      parameters: [
        {
          name: "page",
          in: "query",
          required: false,
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
        200: { description: "List of dorm rules" },
        400: { description: "Invalid pagination parameters" },
        401: { description: "Unauthorized" },
      },
    },
    post: {
      tags: ["Dorm Rules"],
      summary: "Create a dorm rule",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name"],
              properties: {
                name: { type: "string", example: "No running in hallway" },
                rule_description: {
                  type: "string",
                  example: "Students must not run in the dorm hallway.",
                },
                penalty_description: {
                  type: "string",
                  example: "Verbal warning for first offense.",
                },
                point_deduction: {
                  type: "integer",
                  example: 5,
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
  "/api/dorm/rule/{id}": {
    get: {
      tags: ["Dorm Rules"],
      summary: "Get a dorm rule",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: { description: "Dorm rule details" },
        401: { description: "Unauthorized" },
        404: { description: "Rule not found" },
      },
    },
    put: {
      tags: ["Dorm Rules"],
      summary: "Update a dorm rule",
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
                rule_description: { type: "string" },
                penalty_description: { type: "string" },
                point_deduction: { type: "integer" },
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
        404: { description: "Rule not found" },
      },
    },
    delete: {
      tags: ["Dorm Rules"],
      summary: "Soft-delete a dorm rule",
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
        404: { description: "Rule not found" },
      },
    },
  },
};
