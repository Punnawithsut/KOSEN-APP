import { saveSubscription } from "@/lib/notifications/subscriptions";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload?.endpoint) {
      return Response.json(
        { error: "Missing endpoint in push subscription payload." },
        { status: 400 },
      );
    }

    const userId = String(payload.userId ?? "local-user");

    saveSubscription(userId, {
      endpoint: payload.endpoint,
      keys: {
        p256dh: payload.keys?.p256dh,
        auth: payload.keys?.auth,
      },
    });

    return Response.json({
      ok: true,
      message: "Push subscription received.",
      userId,
      subscription: payload,
    });
  } catch (error) {
    console.error("Push subscription failed:", error);
    return Response.json(
      { error: "Unable to process push subscription." },
      { status: 500 },
    );
  }
}
