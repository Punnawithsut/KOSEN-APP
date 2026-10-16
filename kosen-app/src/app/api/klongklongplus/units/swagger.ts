const unitIdParameters = [
  {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string", format: "uuid" },
  },
];

const itemTypeSchema = {
  type: "string",
  enum: ["calculator", "charger"],
};

const unitStatusSchema = {
  type: "string",
  enum: ["available", "out", "repair", "lost"],
};

export const unitsDocs = {
  "/api/klongklongplus/units": {
    get: {
      tags: ["Units"],
      summary: "List inventory units",
      description: "Requires an admin session.",
      parameters: [
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          name: "itemType",
          in: "query",
          required: false,
          schema: itemTypeSchema,
        },
        {
          name: "status",
          in: "query",
          required: false,
          schema: unitStatusSchema,
        },
        {
          name: "isActive",
          in: "query",
          required: false,
          description: "Filter by whether the unit is enabled",
          schema: { type: "boolean" },
        },
      ],
      responses: {
        200: {
          description:
            "Units and pagination metadata (items, total, page, pageSize)",
        },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
      },
    },
    post: {
      tags: ["Units"],
      summary: "Create an inventory unit",
      description: "Requires an admin session.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["code", "itemType"],
              properties: {
                code: {
                  type: "string",
                  minLength: 1,
                  maxLength: 30,
                  example: "CALC-012",
                },
                itemType: itemTypeSchema,
                note: { type: "string", example: "Scientific calculator" },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Unit created successfully" },
        400: { description: "Invalid request or field values" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
      },
    },
  },
  "/api/klongklongplus/units/{id}": {
    put: {
      tags: ["Units"],
      summary: "Update an inventory unit",
      description:
        "All fields are optional. Set isActive to false to disable a unit while preserving loan history. Requires an admin session.",
      parameters: unitIdParameters,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                code: { type: "string", minLength: 1, maxLength: 30 },
                itemType: itemTypeSchema,
                note: { type: "string", example: "Updated condition note" },
                isActive: { type: "boolean", example: false },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Unit updated successfully" },
        400: { description: "Invalid request or field values" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
        404: { description: "Unit not found" },
      },
    },
    delete: {
      tags: ["Units"],
      summary: "Delete an inventory unit",
      description:
        "A unit with loan history cannot be deleted; disable it using PUT with isActive=false instead. Requires an admin session.",
      parameters: unitIdParameters,
      responses: {
        200: { description: "Unit deleted successfully" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
        404: { description: "Unit not found" },
        409: { description: "Unit has loan history and cannot be deleted" },
      },
    },
  },
  "/api/klongklongplus/units/{id}/status": {
    patch: {
      tags: ["Units"],
      summary: "Update an inventory unit's status",
      description: "Requires an admin session.",
      parameters: unitIdParameters,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["status"],
              properties: { status: unitStatusSchema },
            },
          },
        },
      },
      responses: {
        200: { description: "Unit status updated successfully" },
        400: { description: "Invalid request or status value" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
        404: { description: "Unit not found" },
      },
    },
  },
};
