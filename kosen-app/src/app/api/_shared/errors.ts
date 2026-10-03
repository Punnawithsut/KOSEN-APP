import { NextResponse } from "next/server";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly reason?: string;

  constructor(message: string, statusCode = 400, reason?: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.reason = reason;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad Request", reason?: string) {
    super(message, 400, reason);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access", reason?: string) {
    super(message, 401, reason);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden action", reason?: string) {
    super(message, 403, reason);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", reason?: string) {
    super(message, 404, reason);
  }
}

export class ValidationError extends AppError {
  public readonly details?: unknown;

  constructor(message = "Validation failed", details?: unknown) {
    super(message, 422);
    this.details = details;
  }
}

/**
  Formats thrown errors into standardized JSON responses matching the client contract.
 */
export function handleApiError(error: unknown) {
  console.error("[API Error]:", error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        ...(error.reason ? { reason: error.reason } : {}),
        ...("details" in error ? { details: (error as ValidationError).details } : {}),
      },
      { status: error.statusCode }
    );
  }

  // Fallback for unhandled unexpected JS errors
  return NextResponse.json(
    {
      ok: false,
      error: "Internal server error",
    },
    { status: 500 }
  );
}