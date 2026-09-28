import webPush, {
  type PushSubscription as WebPushSubscription,
} from "web-push";

import {
  getAllSubscriptions,
  getSubscriptionForUser,
} from "@/lib/notifications/subscriptions";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:admin@kosen.local";

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

type SendPushInput = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: { action: string; title: string; icon?: string }[];
};

export async function sendNotificationToUser(
  userId: string,
  payload: SendPushInput,
) {
  const subscription = getSubscriptionForUser(userId);

  if (!subscription) {
    return { ok: false, reason: "No subscription for user" };
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return { ok: false, reason: "Missing VAPID keys" };
  }

  await webPush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    } as WebPushSubscription,
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon ?? "/icons/icon-192.png",
      badge: payload.badge ?? "/icons/icon-192.png",
      tag: payload.tag ?? "kosen-notification",
      data: payload.data ?? { url: "/" },
      actions: payload.actions ?? [{ action: "open", title: "Open app" }],
    }),
  );

  return { ok: true };
}

export async function sendNotificationToAll(payload: SendPushInput) {
  const subscriptions = getAllSubscriptions();

  if (!subscriptions.length) {
    return { ok: false, reason: "No subscriptions available" };
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return { ok: false, reason: "Missing VAPID keys" };
  }

  const sends = subscriptions.map((subscription) =>
    webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      } as WebPushSubscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon ?? "/icons/icon-192.png",
        badge: payload.badge ?? "/icons/icon-192.png",
        tag: payload.tag ?? "kosen-notification",
        data: payload.data ?? { url: "/" },
        actions: payload.actions ?? [{ action: "open", title: "Open app" }],
      }),
    ),
  );

  await Promise.allSettled(sends);

  return { ok: true, count: subscriptions.length };
}
