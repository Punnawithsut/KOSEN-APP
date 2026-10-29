import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasActiveUser, isActiveAdmin } from "./auth.repo";
import {
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  handleApiError,
} from "./errors";
import { enforceApiRateLimit } from "./rate_limits";
import type { User } from "@supabase/supabase-js";

export type SessionContext<T = Record<string, string>> = {
  user: User;
  params: T;
};

export type AdminContext<T = Record<string, string>> = SessionContext<T> & {
  userRole: "admin";
};

export type Handler<C> = (req: NextRequest, ctx: C) => Promise<NextResponse>;

/**
 * Checks if the user is authenticated (logged in).
 */
export function withSessionMiddleware<T = Record<string, string>>(
  handler: Handler<SessionContext<T>>,
) {
  return async (req: NextRequest, props: { params: Promise<T> }) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        throw new UnauthorizedError(
          "You must be logged in to access this route",
        );
      }

      if (!(await hasActiveUser(user.id))) {
        throw new UnauthorizedError("User account is not active");
      }

      const rateLimitResponse = await enforceApiRateLimit(req);
      if (rateLimitResponse) return rateLimitResponse;

      const params = await props.params;

      return await handler(req, { user, params });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Checks if the user is authenticated AND has the 'admin' role in the database.
 */
export function useAdminMiddleware<T = Record<string, string>>(
  handler: Handler<AdminContext<T>>,
) {
  return async (req: NextRequest, props: { params: Promise<T> }) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        throw new UnauthorizedError(
          "You must be logged in to access this route",
        );
      }

      // Query database to check user role
      if (!(await isActiveAdmin(user.id))) {
        throw new ForbiddenError("Forbidden: Admin privileges required");
      }

      const rateLimitResponse = await enforceApiRateLimit(req);
      if (rateLimitResponse) return rateLimitResponse;

      const params = await props.params;

      return await handler(req, { user, userRole: "admin", params });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Safely parses the JSON body or throws a BadRequestError.
 */
export async function parseJsonBody<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new BadRequestError("Invalid or missing JSON payload");
  }
}
