export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload?.endpoint) {
      return Response.json(
        { error: "Missing endpoint in push subscription payload." },
        { status: 400 },
      );
    }

    // TODO: persist this payload to a database or your auth/session store.
    // Example: insert into a notification_subscriptions table keyed by user_id.
    // This is the browser subscription that your server later uses to send push notifications.

    return Response.json({
      ok: true,
      message: "Push subscription received.",
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
