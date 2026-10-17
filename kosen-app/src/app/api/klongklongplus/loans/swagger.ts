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
  "/api/klongklongplus/loans/available-slots": {
    get: {
      tags: ["Loans"],
      summary: "List available booking slots",
      description:
        "Returns all active future slots that have not been reserved. Slot kind is selected automatically: exam slots are returned during the term's midterm or final exam date ranges; normal slots are returned on other dates. Requires an authenticated session.",
      parameters: [
        {
          name: "unitId",
          in: "query",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
        {
          name: "slotDate",
          in: "query",
          required: true,
          schema: { type: "string", format: "date" },
        },
        {
          name: "excludeLoanId",
          in: "query",
          required: false,
          schema: { type: "string", format: "uuid" },
          description:
            "Pending loan to exclude from reservation checks when editing that loan",
        },
      ],
      responses: {
        200: { description: "All available slots for the selected unit and date" },
        400: { description: "Invalid date or date outside an active term" },
        401: { description: "Unauthorized" },
        404: { description: "Unit not found" },
        409: { description: "Unit is unavailable" },
      },
    },
  },
  "/api/klongklongplus/loans": {
    post: {
      tags: ["Loans"],
      summary: "Create a loan request",
      description:
        "Creates a pending request for the authenticated user, including admins. The unit type is determined from the selected unit; optional itemType must match that unit.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["unitId", "termId", "slotId", "slotDate"],
              properties: {
                unitId: { type: "string", format: "uuid" },
                itemType: { type: "string", enum: ["calculator", "charger"] },
                termId: { type: "string", format: "uuid" },
                slotId: { type: "string", format: "uuid" },
                slotDate: { type: "string", format: "date" },
                returnNote: { type: "string", nullable: true },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Loan request created" },
        400: { description: "Invalid or past booking details" },
        401: { description: "Unauthorized" },
        404: { description: "Unit, term, or slot not found" },
        409: { description: "Unit is unavailable or already reserved" },
      },
    },
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
          name: "searchName",
          in: "query",
          required: false,
          description:
            "Case-insensitive partial search across the borrower's first name, last name, or full name",
          schema: { type: "string", example: "pun" },
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
  "/api/klongklongplus/loans/mine": {
    get: {
      tags: ["Loans"],
      summary: "List the authenticated user's loan requests",
      description:
        "Returns the current user's loans with borrower, unit, slot, and term details. Results are paginated and exclude soft-deleted requests.",
      parameters: [
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          name: "unitSearch",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Filter by unit name or code",
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
          schema: { type: "string", format: "date" },
        },
        {
          name: "slotId",
          in: "query",
          required: false,
          schema: { type: "string", format: "uuid" },
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
      ],
      responses: {
        200: {
          description:
            "User loans and pagination metadata (items, total, page, pageSize)",
        },
        401: { description: "Unauthorized" },
      },
    },
  },
  "/api/klongklongplus/loans/{id}": {
    put: {
      tags: ["Loans"],
      summary: "Edit a pending loan request",
      description:
        "Any authenticated user, including admins, can edit their own pending request. unitId is immutable; a different unit requires deleting and recreating the request.",
      parameters: loanIdParameters,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              minProperties: 1,
              properties: {
                termId: { type: "string", format: "uuid" },
                slotId: { type: "string", format: "uuid" },
                slotDate: { type: "string", format: "date" },
                returnNote: { type: "string", nullable: true },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Loan request updated" },
        400: { description: "Request is not pending or contains invalid fields" },
        401: { description: "Unauthorized" },
        403: {
          description:
            "Loan request belongs to another user or caller is an admin",
        },
        404: { description: "Loan, term, or slot not found" },
        409: { description: "Unit is unavailable or already reserved" },
      },
    },
    delete: {
      tags: ["Loans"],
      summary: "Delete a pending loan request",
      description:
        "Any authenticated user, including admins, can delete their own pending request. The request is soft-deleted and marked cancelled.",
      parameters: loanIdParameters,
      responses: {
        200: { description: "Loan request deleted" },
        400: { description: "Loan request is not pending" },
        401: { description: "Unauthorized" },
        403: {
          description:
            "Loan request belongs to another user or caller is an admin",
        },
        404: { description: "Loan request not found" },
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
