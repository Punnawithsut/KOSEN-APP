const termIdParameter = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};

export const termsDocs = {
  "/api/klongklongplus/terms/current": {
    get: {
      tags: ["Terms"],
      summary: "Get the current term",
      description:
        "Returns the non-deleted term whose date range includes today's date in Asia/Bangkok. Requires a logged-in session.",
      responses: {
        200: { description: "Current term" },
        401: { description: "Unauthorized" },
        404: { description: "No current term found" },
      },
    },
  },
  "/api/klongklongplus/terms": {
    get: {
      tags: ["Terms"],
      summary: "List terms",
      description:
        "Returns non-deleted terms. Requires an admin session.",
      parameters: [
        {
          name: "page",
          in: "query",
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          name: "search",
          in: "query",
          schema: { type: "string" },
          description: "Case-insensitive partial match on term name",
        },
      ],
      responses: {
        200: { description: "Paginated terms" },
        400: { description: "Invalid page" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
      },
    },
    post: {
      tags: ["Terms"],
      summary: "Create a term",
      description: "Requires an admin session.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "startDate", "endDate"],
              properties: {
                name: { type: "string", maxLength: 100, example: "1/2569" },
                startDate: { type: "string", format: "date" },
                endDate: { type: "string", format: "date" },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Term created" },
        400: { description: "Invalid term data" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
      },
    },
  },
  "/api/klongklongplus/terms/{id}": {
    get: {
      tags: ["Terms"],
      summary: "Get a term",
      parameters: [termIdParameter],
      responses: {
        200: { description: "Term details" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
        404: { description: "Term not found" },
      },
    },
    put: {
      tags: ["Terms"],
      summary: "Update a term",
      parameters: [termIdParameter],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              minProperties: 1,
              properties: {
                name: { type: "string", maxLength: 100 },
                startDate: { type: "string", format: "date" },
                endDate: { type: "string", format: "date" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Term updated" },
        400: { description: "Invalid term data" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
        404: { description: "Term not found" },
      },
    },
    delete: {
      tags: ["Terms"],
      summary: "Soft-delete a term",
      description:
        "Terms referenced by any loan cannot be deleted. Requires an admin session.",
      parameters: [termIdParameter],
      responses: {
        200: { description: "Term soft-deleted" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
        404: { description: "Term not found" },
        409: { description: "Term is referenced by loans" },
      },
    },
  },
};
