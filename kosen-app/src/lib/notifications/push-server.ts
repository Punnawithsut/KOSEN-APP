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

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
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

export async function sendNotificationToUser(
  userId: string,
  payload: SendPushInput,
) {
  const subscriptions = await getSubscriptionForUser(userId);

  if (!subscriptions || subscriptions.length === 0) {
    return { ok: false, reason: "No subscription found for user." };
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return { ok: false, reason: "Missing VAPID keys on server environment." };
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? "/icons/icon-192.png",
    badge: payload.badge ?? "/icons/icon-192.png",
    tag: payload.tag ?? "kosen-notification",
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
      } catch (error: any) {
        const statusCode = error?.statusCode;

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
    tag: payload.tag ?? "kosen-notification",
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
      } catch (error: any) {
        const statusCode = error?.statusCode;

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