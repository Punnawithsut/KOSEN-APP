import { saveSubscription } from "@/lib/notifications/subscriptions";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload?.endpoint || !payload?.keys?.p256dh || !payload?.keys?.auth) {
      return Response.json(
        {
          error: "Invalid push subscription payload. Missing endpoint or keys.",
        },
        { status: 400 },
      );
    }

    if (!payload?.userId) {
      return Response.json(
        { error: "Missing userId. A valid user ID is required." },
        { status: 400 },
      );
    }

    const userId = String(payload.userId);

    await saveSubscription(userId, {
      endpoint: payload.endpoint,
      keys: {
        p256dh: payload.keys.p256dh,
        auth: payload.keys.auth,
      },
    });

    return Response.json({
      ok: true,
      message: "Push subscription received.",
      userId,
    });
  } catch (error) {
    console.error("Push subscription failed:", error);
    return Response.json(
      { error: "Unable to process push subscription." },
      { status: 500 },
    );
  }
}
