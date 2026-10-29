import { BadRequestError } from "../_shared/errors";
import { sendNotificationToUser, type PushDeliveryFailure } from "@/lib/notifications/push-server";
import { findActiveRecipientIds } from "./notification.repo";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function sendNotifications(payload: unknown) {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) throw new BadRequestError("Invalid notification payload.");
  const { targetUserId, title, body, data } = payload as Record<string, unknown>;
  const ids = typeof targetUserId === "string" ? [targetUserId] : Array.isArray(targetUserId) ? targetUserId : [];
  if (!ids.length || ids.some((id) => typeof id !== "string" || !UUID_PATTERN.test(id))) throw new BadRequestError("Provide one or more valid recipient user IDs.");
  const recipientIds = [...new Set(ids as string[])];
  if (recipientIds.length > 100) throw new BadRequestError("A maximum of 100 recipients is allowed.");
  if (typeof title !== "string" || !title.trim() || title.trim().length > 200) throw new BadRequestError("Title is required and must be at most 200 characters.");
  if (typeof body !== "string" || !body.trim() || body.trim().length > 2000) throw new BadRequestError("Body is required and must be at most 2000 characters.");

  const active = await findActiveRecipientIds(recipientIds);
  if (active.length !== recipientIds.length) throw new BadRequestError("One or more recipients do not exist or are no longer active.");
  const notificationData = typeof data === "object" && data !== null && !Array.isArray(data) ? data as Record<string, unknown> : { url: "/" };
  const tag = `kosen-${Date.now()}`;
  const results = await Promise.allSettled(recipientIds.map((userId) => sendNotificationToUser(userId, { title: title.trim(), body: body.trim(), data: notificationData, tag })));
  let successfulUsersCount = 0;
  let totalSentDevices = 0;
  let totalFailedDevices = 0;
  const failures: { userId: string; reason: PushDeliveryFailure }[] = [];
  results.forEach((result, index) => {
    const userId = recipientIds[index]!;
    if (result.status === "rejected") {
      console.error("Notification delivery threw:", { userId, reason: result.reason });
      failures.push({ userId, reason: "delivery_failed" });
    } else if (result.value.ok) {
      successfulUsersCount++;
      totalSentDevices += result.value.sentDevices;
      totalFailedDevices += result.value.failedDevices;
    } else {
      console.error("Notification not delivered:", { userId, reason: result.value.reason, totalDevices: result.value.totalDevices });
      failures.push({ userId, reason: result.value.reason ?? "delivery_failed" });
    }
  });
  return {
    status: successfulUsersCount > 0 ? 200 : 400,
    body: {
      ok: successfulUsersCount > 0,
      totalUsers: recipientIds.length,
      successfulUsersCount,
      failedUsersCount: recipientIds.length - successfulUsersCount,
      totalSentDevices,
      totalFailedDevices,
      ...(failures.length ? { failures } : {}),
      ...(successfulUsersCount === 0 ? { reason: describeFailures(failures) } : {}),
    },
  };
}

function describeFailures(failures: { reason: PushDeliveryFailure }[]) {
  if (failures.some((failure) => failure.reason === "missing_vapid_keys")) return "Push is not configured on this server: VAPID keys are missing.";
  if (failures.every((failure) => failure.reason === "no_subscription")) return "None of the selected recipients have a device subscribed to push notifications.";
  return "Push delivery failed for every selected recipient.";
}
