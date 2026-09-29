import { deleteSubscription } from "@/lib/notifications/subscriptions";

export async function DELETE(request: Request) {
  try {
    const { endpoint } = await request.json();

    if (!endpoint) {
      return Response.json(
        { error: "Missing endpoint." },
        { status: 400 },
      );
    }

    await deleteSubscription(endpoint);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Unsubscribe failed:", error);
    return Response.json(
      { error: "Unable to process unsubscribe." },
      { status: 500 },
    );
  }
}