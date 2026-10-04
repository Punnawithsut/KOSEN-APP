export const profileDocs = {
  "/api/profile/": {
    get: {
      tags: ["Profile"],
      summary: "GET /api/profile/",
      responses: {
        200: { description: "Success" },
        401: { description: "Unauthorized" },
      },
    },
    put: {
      tags: ["Profile"],
      summary: "PUT /api/profile/",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                studentId: { type: "string", example: "66010001" },
                firstName: { type: "string", example: "Pun" },
                lastName: { type: "string", example: "Sutisukon" },
                phone: { type: "string", example: "0812345678" },
                department: {
                  type: "string",
                  enum: [
                    "Computer Engineering",
                    "Mechanical Engineering",
                    "Electrical and Electronics Engineering",
                  ],
                  example: "Computer Engineering",
                },
                year: { type: "integer", minimum: 1, maximum: 5, example: 3 },
                dormBuilding: { type: "string", enum: ["7", "8"], example: "7" },
                dormRoom: { type: "string", example: "405" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Updated successfully" },
        400: { description: "Validation error" },
        401: { description: "Unauthorized" },
      },
    },
  },
};