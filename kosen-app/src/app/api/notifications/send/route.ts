import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendNotificationToUser } from "@/lib/notifications/push-server";

export async function POST(request: Request) {
  try {
    // 1. Verify user authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized request" },
        { status: 401 },
      );
    }

    // 2. Parse request payload
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

    // 3. Normalize single string or array into string[]
    const recipientIds: string[] = Array.isArray(targetUserId)
      ? targetUserId
      : [targetUserId];

    if (recipientIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "targetUserId list cannot be empty" },
        { status: 400 },
      );
    }

    // 4. Dispatch push notifications to all targeted users in parallel
    const results = await Promise.allSettled(
      recipientIds.map((userId) =>
        sendNotificationToUser(userId, {
          title,
          body,
          data: data ?? { url: "/" },
        }),
      ),
    );

    // 5. Aggregate success/failure metrics
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

    // If none of the targeted users received the push notification
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
}
