import webPush, {
  type PushSubscription as WebPushSubscription,
} from "web-push";

import {
  deleteSubscription,
  getAllSubscriptions,
  getSubscriptionForUser,
} from "@/lib/notifications/subscriptions";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:admin@kosen.local";

function getStatusCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) {
    return undefined;
  }

  return typeof error.statusCode === "number" ? error.statusCode : undefined;
}

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

/**
 * Notifications that share a `tag` replace each other in place, and a
 * replacement does not re-alert. A constant tag therefore made every resend
 * look like nothing had been delivered.
 */
function uniqueNotificationTag(): string {
  return `kosen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type NotificationAction = {
  action: string;
  title: string;
  icon?: string;
};

export type SendPushInput = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
};

export type PushDeliveryFailure =
  "no_subscription" | "missing_vapid_keys" | "delivery_failed";

export type PushDeliveryResult = {
  ok: boolean;
  /** Set only when nothing reached a device. */
  reason?: PushDeliveryFailure;
  totalDevices: number;
  sentDevices: number;
  failedDevices: number;
};

export async function sendNotificationToUser(
  userId: string,
  payload: SendPushInput,
): Promise<PushDeliveryResult> {
  const subscriptions = await getSubscriptionForUser(userId);

  // Distinct from a delivery error: there is no device to talk to at all.
  // Reporting these two the same way made a never-subscribed recipient look
  // like a push-service failure.
  if (subscriptions.length === 0) {
    return {
      ok: false,
      reason: "no_subscription",
      totalDevices: 0,
      sentDevices: 0,
      failedDevices: 0,
    };
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return {
      ok: false,
      reason: "missing_vapid_keys",
      totalDevices: subscriptions.length,
      sentDevices: 0,
      failedDevices: subscriptions.length,
    };
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? "/icons/icon-192.png",
    badge: payload.badge ?? "/icons/icon-192.png",
    tag: payload.tag ?? uniqueNotificationTag(),
    data: payload.data ?? { url: "/" },
    actions: payload.actions ?? [{ action: "open", title: "Open app" }],
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          } as WebPushSubscription,
          notificationPayload,
        );
        return { ok: true, endpoint: subscription.endpoint };
      } catch (error: unknown) {
        const statusCode = getStatusCode(error);

        if (statusCode === 410 || statusCode === 404) {
          await deleteSubscription(subscription.endpoint);
        }

        console.error("Failed to send push notification to device:", {
          userId,
          endpoint: subscription.endpoint,
          statusCode,
          message: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    }),
  );

  const successfulCount = results.filter(
    (res) => res.status === "fulfilled",
  ).length;

  return {
    ok: successfulCount > 0,
    ...(successfulCount === 0 ? { reason: "delivery_failed" as const } : {}),
    totalDevices: subscriptions.length,
    sentDevices: successfulCount,
    failedDevices: subscriptions.length - successfulCount,
  };
}

export async function sendNotificationToAll(payload: SendPushInput) {
  const subscriptions = await getAllSubscriptions();

  if (!subscriptions || subscriptions.length === 0) {
    return { ok: false, reason: "No subscriptions available" };
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return { ok: false, reason: "Missing VAPID keys" };
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? "/icons/icon-192.png",
    badge: payload.badge ?? "/icons/icon-192.png",
    tag: payload.tag ?? uniqueNotificationTag(),
    data: payload.data ?? { url: "/" },
    actions: payload.actions ?? [{ action: "open", title: "Open app" }],
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          } as WebPushSubscription,
          notificationPayload,
        );
        return { ok: true, endpoint: subscription.endpoint };
      } catch (error: unknown) {
        const statusCode = getStatusCode(error);

        if (statusCode === 410 || statusCode === 404) {
          await deleteSubscription(subscription.endpoint);
        }

        console.error("Failed broadcast notification to device:", {
          endpoint: subscription.endpoint,
          statusCode,
          message: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    }),
  );

  const successfulCount = results.filter(
    (res) => res.status === "fulfilled",
  ).length;

  return {
    ok: successfulCount > 0,
    totalDevices: subscriptions.length,
    sentDevices: successfulCount,
    failedDevices: subscriptions.length - successfulCount,
  };
}
