const slotIdParameter = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};

export const slotsDocs = {
  "/api/klongklongplus/slots": {
    get: {
      tags: ["Slots"],
      summary: "List slots",
      description:
        "Returns non-deleted slots. Requires an admin session.",
      parameters: [
        {
          name: "page",
          in: "query",
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          name: "kind",
          in: "query",
          schema: { type: "string", enum: ["normal", "exam"] },
        },
        {
          name: "isActive",
          in: "query",
          schema: { type: "boolean" },
        },
      ],
      responses: {
        200: { description: "Paginated slots" },
        400: { description: "Invalid filters" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
      },
    },
    post: {
      tags: ["Slots"],
      summary: "Create a slot",
      description: "Requires an admin session.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["kind", "startTime", "endTime"],
              properties: {
                kind: { type: "string", enum: ["normal", "exam"] },
                startTime: { type: "string", example: "09:00" },
                endTime: { type: "string", example: "10:00" },
                leadMin: { type: "integer", minimum: 0, default: 0 },
                displayOrder: { type: "integer", minimum: 0, default: 0 },
                isActive: { type: "boolean", default: true },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Slot created" },
        400: { description: "Invalid slot data" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
      },
    },
  },
  "/api/klongklongplus/slots/{id}": {
    get: {
      tags: ["Slots"],
      summary: "Get a slot",
      parameters: [slotIdParameter],
      responses: {
        200: { description: "Slot details" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
        404: { description: "Slot not found" },
      },
    },
    put: {
      tags: ["Slots"],
      summary: "Update a slot",
      description:
        "A slot referenced by any loan cannot be deactivated. Requires an admin session.",
      parameters: [slotIdParameter],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              minProperties: 1,
              properties: {
                kind: { type: "string", enum: ["normal", "exam"] },
                startTime: { type: "string", example: "09:00" },
                endTime: { type: "string", example: "10:00" },
                leadMin: { type: "integer", minimum: 0 },
                displayOrder: { type: "integer", minimum: 0 },
                isActive: { type: "boolean" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Slot updated" },
        400: { description: "Invalid slot data" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
        404: { description: "Slot not found" },
        409: { description: "Slot is referenced by loans" },
      },
    },
    delete: {
      tags: ["Slots"],
      summary: "Soft-delete a slot",
      description:
        "Slots referenced by any loan cannot be deleted. Requires an admin session.",
      parameters: [slotIdParameter],
      responses: {
        200: { description: "Slot soft-deleted" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
        404: { description: "Slot not found" },
        409: { description: "Slot is referenced by loans" },
      },
    },
  },
};
