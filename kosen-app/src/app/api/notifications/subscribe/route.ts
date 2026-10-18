import { saveSubscription } from "@/lib/notifications/subscriptions";
import { withSessionMiddleware } from "@/app/api/_shared/middleware";
import { NextResponse } from "next/server";

export const POST = withSessionMiddleware(async (request, { user }) => {
  try {
    const payload = await request.json();

    if (!payload?.endpoint || !payload?.keys?.p256dh || !payload?.keys?.auth) {
      return NextResponse.json(
        {
          error: "Invalid push subscription payload. Missing endpoint or keys.",
        },
        { status: 400 },
      );
    }

    if (payload?.userId && payload.userId !== user.id) {
      return NextResponse.json(
        { error: "You may only subscribe your own user account." },
        { status: 403 },
      );
    }

    await saveSubscription(user.id, {
      endpoint: payload.endpoint,
      keys: {
        p256dh: payload.keys.p256dh,
        auth: payload.keys.auth,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Push subscription received.",
      userId: user.id,
    });
  } catch (error) {
    console.error("Push subscription failed:", error);
    return NextResponse.json(
      { error: "Unable to process push subscription." },
      { status: 500 },
    );
  }
});
