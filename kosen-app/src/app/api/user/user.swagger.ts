export const userDocs = {
  "/api/user": {
    get: {
      tags: ["Users"],
      summary: "Find notification recipients",
      description:
        "Returns active users matching every supplied filter. Requires an admin session. A user may have a null studentId if their profile is incomplete.",
      parameters: [
        {
          name: "department",
          in: "query",
          schema: {
            type: "string",
            enum: [
              "Computer Engineering",
              "Mechatronics Engineering",
              "Electrical and Electronics Engineering",
            ],
          },
          description: "Match a department exactly",
        },
        {
          name: "year",
          in: "query",
          schema: { type: "integer", minimum: 1, maximum: 5 },
          description: "Match an academic year exactly",
        },
        {
          name: "dormBuilding",
          in: "query",
          schema: { type: "string", enum: ["7", "8"] },
          description: "Match a dormitory building exactly",
        },
        {
          name: "dormRoom",
          in: "query",
          schema: { type: "string", maxLength: 50 },
          description: "Match a dormitory room exactly",
        },
      ],
      responses: {
        200: {
          description: "Matching active users",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["ok", "data"],
                properties: {
                  ok: { type: "boolean", example: true },
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["userId", "studentId"],
                      properties: {
                        userId: {
                          type: "string",
                          format: "uuid",
                          example: "5c06f12f-156a-4128-a476-bfb331392002",
                        },
                        studentId: {
                          type: "string",
                          nullable: true,
                          example: "66010001",
                        },
                      },
                    },
                  },
                },
              },
              example: {
                ok: true,
                data: [
                  {
                    userId: "5c06f12f-156a-4128-a476-bfb331392002",
                    studentId: "66010001",
                  },
                ],
              },
            },
          },
        },
        400: { description: "Invalid filter value" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
      },
    },
  },
};