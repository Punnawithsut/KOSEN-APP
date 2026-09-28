import { sendNotificationToAll, sendNotificationToUser } from "@/lib/notifications/push-server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { userId, title = "KOSEN", body = "You have a new update.", icon, badge, tag, data } = payload ?? {};

    if (userId) {
      const result = await sendNotificationToUser(userId, {
        title,
        body,
        icon,
        badge,
        tag,
        data,
      });

      return Response.json(result);
    }

    const result = await sendNotificationToAll({
      title,
      body,
      icon,
      badge,
      tag,
      data,
    });

    return Response.json(result);
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return Response.json(
      { ok: false, error: "Unable to send push notification." },
      { status: 500 },
    );
  }
}
