import { NextResponse } from "next/server";
import { and, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { sendNotificationToUser } from "@/lib/notifications/push-server";
import type { PushDeliveryFailure } from "@/lib/notifications/push-server";
import {
  parseJsonBody,
  useAdminMiddleware as withAdminMiddleware,
} from "@/app/api/_shared/middleware";
import { BadRequestError } from "@/app/api/_shared/errors";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const POST = withAdminMiddleware(async (request) => {
  const payload = await parseJsonBody<unknown>(request);
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    throw new BadRequestError("Invalid notification payload.");
  }

  const { targetUserId, title, body, data } = payload as Record<
    string,
    unknown
  >;
  const recipientIds =
    typeof targetUserId === "string"
      ? [targetUserId]
      : Array.isArray(targetUserId)
        ? targetUserId
        : [];

  if (
    recipientIds.length === 0 ||
    recipientIds.some((id) => typeof id !== "string" || !UUID_PATTERN.test(id))
  ) {
    throw new BadRequestError("Provide one or more valid recipient user IDs.");
  }

  const uniqueRecipientIds = [...new Set(recipientIds as string[])];
  if (uniqueRecipientIds.length > 100) {
    throw new BadRequestError("A maximum of 100 recipients is allowed.");
  }
  if (typeof title !== "string" || !title.trim() || title.trim().length > 200) {
    throw new BadRequestError(
      "Title is required and must be at most 200 characters.",
    );
  }
  if (typeof body !== "string" || !body.trim() || body.trim().length > 2000) {
    throw new BadRequestError(
      "Body is required and must be at most 2000 characters.",
    );
  }

  const activeRecipients = await db
    .select({ userId: users.userId })
    .from(users)
    .where(
      and(inArray(users.userId, uniqueRecipientIds), isNull(users.deletedAt)),
    );

  if (activeRecipients.length !== uniqueRecipientIds.length) {
    throw new BadRequestError(
      "One or more recipients do not exist or are no longer active.",
    );
  }

  const notificationData =
    typeof data === "object" && data !== null && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : { url: "/" };

  // A tag identifies a notification: one already on screen with the same tag is
  // replaced in place, and the replacement does not re-alert. A fixed tag is
  // why resending the same announcement appeared to do nothing.
  // One tag per request, so every recipient gets their own alert.
  const notificationTag = `kosen-${Date.now()}`;

  const results = await Promise.allSettled(
    uniqueRecipientIds.map((userId) =>
      sendNotificationToUser(userId, {
        title: title.trim(),
        body: body.trim(),
        data: notificationData,
        tag: notificationTag,
      }),
    ),
  );

  let successfulUsersCount = 0;
  let totalSentDevices = 0;
  let totalFailedDevices = 0;
  const failures: { userId: string; reason: PushDeliveryFailure }[] = [];

  results.forEach((result, index) => {
    const userId = uniqueRecipientIds[index]!;

    if (result.status === "rejected") {
      console.error("Notification delivery threw:", {
        userId,
        reason: result.reason,
      });
      failures.push({ userId, reason: "delivery_failed" });
      return;
    }

    if (result.value.ok) {
      successfulUsersCount++;
      totalSentDevices += result.value.sentDevices;
      totalFailedDevices += result.value.failedDevices;
      return;
    }

    // Previously dropped on the floor: a fulfilled result with `ok: false`
    // was neither counted nor logged, so the caller could not tell a
    // never-subscribed recipient from a push-service rejection.
    console.error("Notification not delivered:", {
      userId,
      reason: result.value.reason,
      totalDevices: result.value.totalDevices,
    });
    failures.push({
      userId,
      reason: result.value.reason ?? "delivery_failed",
    });
  });

  const failedUsersCount = uniqueRecipientIds.length - successfulUsersCount;
  return NextResponse.json(
    {
      ok: successfulUsersCount > 0,
      totalUsers: uniqueRecipientIds.length,
      successfulUsersCount,
      failedUsersCount,
      totalSentDevices,
      totalFailedDevices,
      ...(failures.length > 0 ? { failures } : {}),
      ...(successfulUsersCount === 0
        ? { reason: describeFailures(failures) }
        : {}),
    },
    { status: successfulUsersCount > 0 ? 200 : 400 },
  );
});

/**
 * Turns per-recipient failure codes into one sentence the admin can act on.
 * "No device subscribed" and "push service rejected it" need different fixes,
 * so they must never share a message.
 */
function describeFailures(failures: { reason: PushDeliveryFailure }[]): string {
  if (failures.some((failure) => failure.reason === "missing_vapid_keys")) {
    return "Push is not configured on this server: VAPID keys are missing.";
  }

  if (failures.every((failure) => failure.reason === "no_subscription")) {
    return "None of the selected recipients have a device subscribed to push notifications.";
  }

  return "Push delivery failed for every selected recipient.";
}
