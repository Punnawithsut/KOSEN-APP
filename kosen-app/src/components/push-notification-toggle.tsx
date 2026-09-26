"use client";

import { useEffect, useState } from "react";
import {
  requestNotificationPermission,
  savePushSubscription,
  subscribeToPushNotifications,
  supportsPushNotifications,
  unsubscribeFromPushNotifications,
} from "@/lib/notifications/push";

export function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const supported = supportsPushNotifications();
    setIsSupported(supported);
    setPermission(
      supported && typeof Notification !== "undefined"
        ? Notification.permission
        : "denied",
    );
  }, []);

  const handleSubscribe = async () => {
    setIsLoading(true);

    try {
      const permissionState = await requestNotificationPermission();
      setPermission(permissionState);

      if (permissionState !== "granted") {
        return;
      }

      const subscription = await subscribeToPushNotifications(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      );

      if (subscription) {
        await savePushSubscription(subscription, {
          userId: "guest-user",
        });
      }

      setIsSubscribed(Boolean(subscription));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);

    try {
      const didUnsubscribe = await unsubscribeFromPushNotifications();
      if (didUnsubscribe) {
        setIsSubscribed(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Push notifications are not supported in this browser.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-900">Web push notifications</p>
          <p className="text-sm text-slate-600">
            {permission === "granted"
              ? "Notifications are enabled."
              : "Enable notifications to receive appointment reminders and updates."}
          </p>
        </div>

        {isSubscribed || permission === "granted" ? (
          <button
            type="button"
            disabled={isLoading}
            onClick={handleUnsubscribe}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isLoading ? "Working..." : "Disable"}
          </button>
        ) : (
          <button
            type="button"
            disabled={isLoading}
            onClick={handleSubscribe}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isLoading ? "Enabling..." : "Enable"}
          </button>
        )}
      </div>
    </div>
  );
}
