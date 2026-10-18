import { NextResponse } from "next/server";
import { sendNotificationToUser } from "@/lib/notifications/push-server";
import { withSessionMiddleware } from "@/app/api/_shared/middleware";

export const POST = withSessionMiddleware(async (request) => {
  try {
    // Parse request payload.
    const bodyPayload = await request.json();
    const { targetUserId, title, body, data } = bodyPayload;

    if (!targetUserId || !title || !body) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing required fields: targetUserId, title, or body",
        },
        { status: 400 },
      );
    }

    // Normalize a single string or array into string[].
    const recipientIds: string[] = Array.isArray(targetUserId)
      ? targetUserId
      : [targetUserId];

    if (recipientIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "targetUserId list cannot be empty" },
        { status: 400 },
      );
    }
    if (recipientIds.length > 100) {
      return NextResponse.json(
        { ok: false, error: "A maximum of 100 recipients is allowed." },
        { status: 400 },
      );
    }

    // Dispatch push notifications to all targeted users in parallel.
    const results = await Promise.allSettled(
      recipientIds.map((userId) =>
        sendNotificationToUser(userId, {
          title,
          body,
          data: data ?? { url: "/" },
        }),
      ),
    );

    // Aggregate success/failure metrics.
    let successfulUsersCount = 0;
    let totalSentDevices = 0;
    let totalFailedDevices = 0;

    results.forEach((res) => {
      if (res.status === "fulfilled" && res.value.ok) {
        successfulUsersCount++;
        totalSentDevices += res.value.sentDevices ?? 0;
        totalFailedDevices += res.value.failedDevices ?? 0;
      }
    });

    // If none of the targeted users received the push notification.
    if (successfulUsersCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          reason:
            "No active push notification subscriptions found for target user(s).",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      totalUsers: recipientIds.length,
      successfulUsersCount,
      totalSentDevices,
      totalFailedDevices,
    });
  } catch (error) {
    console.error("Error in /api/notifications/send route:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
});
