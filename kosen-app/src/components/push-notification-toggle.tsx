"use client";

import { useEffect, useState } from "react";
import {
  supportsPushNotifications,
  subscribeUserToPush,
  unsubscribeUserFromPush,
} from "@/lib/notifications/push";

// Valid UUID v4 fallback to avoid Postgres UUID parsing errors
const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

interface PushNotificationToggleProps {
  userId?: string;
}

export function PushNotificationToggle({ userId }: PushNotificationToggleProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    setIsSupported(supportsPushNotifications());
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const targetUserId = userId || DEFAULT_USER_ID;
      await subscribeUserToPush(targetUserId);
      setPermission(Notification.permission);
      setIsSubscribed(true);
    } catch (error) {
      console.error("Subscription failed:", error);
      setPermission(Notification.permission);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      const didUnsubscribe = await unsubscribeUserFromPush();
      if (didUnsubscribe) {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error("Unsubscribe failed:", error);
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
          <p className="text-sm font-medium text-slate-900">
            Web push notifications
          </p>
          <p className="text-sm text-slate-600">
            {permission === "granted" || isSubscribed
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