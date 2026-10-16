const loanIdParameter = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};

const reasonRequestBody = {
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["reason"],
        properties: {
          reason: { type: "string", minLength: 1, example: "Damaged item" },
        },
      },
    },
  },
};

const conditionRequestBody = {
  required: false,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          condition: {
            type: "string",
            description: "Optional condition note for the item",
            example: "Small scratch on the back",
          },
        },
      },
    },
  },
};

const loanIdParameters = [loanIdParameter];

export const loansDocs = {
  "/api/klongklongplus/loans": {
    get: {
      tags: ["Loans"],
      summary: "List loans",
      description:
        "Returns loans with borrower, approver, unit, slot, and term details. Requires an admin session.",
      parameters: [
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          name: "status",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: [
              "pending",
              "approved",
              "delivered",
              "returned",
              "overdue",
              "cancelled",
              "rejected",
              "expired",
              "no_show",
            ],
          },
        },
        {
          name: "itemType",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["calculator", "charger"] },
        },
        {
          name: "slotDate",
          in: "query",
          required: false,
          schema: { type: "string", format: "date", example: "2026-10-11" },
        },
        {
          name: "slotId",
          in: "query",
          required: false,
          schema: { type: "string", format: "uuid" },
        },
        {
          name: "borrowerId",
          in: "query",
          required: false,
          schema: { type: "string", format: "uuid" },
        },
        {
          name: "mine",
          in: "query",
          required: false,
          description: "Set true to show loans assigned to the current admin",
          schema: { type: "boolean", default: false },
        },
      ],
      responses: {
        200: {
          description:
            "Loans and pagination metadata (items, total, page, pageSize)",
        },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
      },
    },
  },
  "/api/klongklongplus/loans/{id}/accept": {
    patch: {
      tags: ["Loans"],
      summary: "Approve a pending loan",
      description:
        "The first admin to approve a pending loan becomes its responsible admin.",
      parameters: loanIdParameters,
      responses: {
        200: { description: "Loan approved" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
        404: { description: "Loan not found" },
        409: { description: "Loan is not pending" },
      },
    },
  },
  "/api/klongklongplus/loans/{id}/reject": {
    patch: {
      tags: ["Loans"],
      summary: "Reject a pending loan",
      parameters: loanIdParameters,
      requestBody: reasonRequestBody,
      responses: {
        200: { description: "Loan rejected" },
        400: { description: "A rejection reason is required" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
        404: { description: "Loan not found" },
        409: { description: "Loan is not pending" },
      },
    },
  },
  "/api/klongklongplus/loans/{id}/deliver": {
    patch: {
      tags: ["Loans"],
      summary: "Mark an approved loan as delivered",
      description: "Only the responsible admin can hand over the item.",
      parameters: loanIdParameters,
      requestBody: conditionRequestBody,
      responses: {
        200: { description: "Loan marked as delivered" },
        401: { description: "Unauthorized" },
        403: {
          description:
            "Admin privileges required or current admin is not responsible for this loan",
        },
        404: { description: "Loan not found" },
        409: { description: "Loan is not approved" },
      },
    },
  },
  "/api/klongklongplus/loans/{id}/return": {
    patch: {
      tags: ["Loans"],
      summary: "Confirm the return of a loan",
      description:
        "Only the responsible admin can confirm a delivered or overdue loan's return.",
      parameters: loanIdParameters,
      requestBody: conditionRequestBody,
      responses: {
        200: { description: "Loan marked as returned" },
        401: { description: "Unauthorized" },
        403: {
          description:
            "Admin privileges required or current admin is not responsible for this loan",
        },
        404: { description: "Loan not found" },
        409: { description: "Loan is not delivered or overdue" },
      },
    },
  },
  "/api/klongklongplus/loans/{id}/no-show": {
    patch: {
      tags: ["Loans"],
      summary: "Mark an approved loan as no-show",
      description: "Only the responsible admin can mark a loan as no-show.",
      parameters: loanIdParameters,
      responses: {
        200: { description: "Loan marked as no-show" },
        401: { description: "Unauthorized" },
        403: {
          description:
            "Admin privileges required or current admin is not responsible for this loan",
        },
        404: { description: "Loan not found" },
        409: { description: "Loan is not approved" },
      },
    },
  },
  "/api/klongklongplus/loans/{id}/cancel": {
    patch: {
      tags: ["Loans"],
      summary: "Cancel an approved loan",
      description:
        "Only the responsible admin can cancel an approved loan. The cancellation reason is required.",
      parameters: loanIdParameters,
      requestBody: reasonRequestBody,
      responses: {
        200: { description: "Loan cancelled" },
        400: { description: "A cancellation reason is required" },
        401: { description: "Unauthorized" },
        403: {
          description:
            "Admin privileges required or current admin is not responsible for this loan",
        },
        404: { description: "Loan not found" },
        409: { description: "Loan is not approved" },
      },
    },
  },
  "/api/klongklongplus/loans/{id}/release": {
    patch: {
      tags: ["Loans"],
      summary: "Release responsibility for an approved loan",
      description:
        "The responsible admin releases the assignment without changing the loan status, allowing another admin to claim it.",
      parameters: loanIdParameters,
      responses: {
        200: { description: "Loan released back to the queue" },
        401: { description: "Unauthorized" },
        403: {
          description:
            "Admin privileges required or current admin is not responsible for this loan",
        },
        404: { description: "Loan not found" },
        409: { description: "Loan is not approved" },
      },
    },
  },
  "/api/klongklongplus/loans/{id}/reassign": {
    patch: {
      tags: ["Loans"],
      summary: "Claim an unassigned approved loan",
      description:
        "Assigns the current admin to an approved loan that has no responsible admin.",
      parameters: loanIdParameters,
      responses: {
        200: { description: "Loan picked up" },
        401: { description: "Unauthorized" },
        403: { description: "Admin privileges required" },
        404: { description: "Loan not found" },
        409: {
          description:
            "Loan is not approved or already has a responsible admin",
        },
      },
    },
  },
};
