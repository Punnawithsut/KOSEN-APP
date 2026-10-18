import { deleteSubscriptionForUser } from "@/lib/notifications/subscriptions";
import { withSessionMiddleware } from "@/app/api/_shared/middleware";
import { NextResponse } from "next/server";

export const DELETE = withSessionMiddleware(async (request, { user }) => {
  try {
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing endpoint." },
        { status: 400 },
      );
    }

    await deleteSubscriptionForUser(user.id, endpoint);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unsubscribe failed:", error);
    return NextResponse.json(
      { error: "Unable to process unsubscribe." },
      { status: 500 },
    );
  }
});