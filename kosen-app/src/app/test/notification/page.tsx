"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }

  return output;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

export default function NotificationTestPage() {
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported" | "loading"
  >("loading");
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState(
    "Appointment reminder: your session starts in 15 minutes.",
  );
  const [status, setStatus] = useState("Waiting to start.");

  useEffect(() => {
    setPermission(
      typeof Notification === "undefined"
        ? "unsupported"
        : Notification.permission,
    );
  }, []);

  async function registerAndSubscribe() {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setStatus("This browser does not support web push notifications.");
      return;
    }

    try {
      setStatus("Clearing stale service workers...");
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => registration.unregister()),
      );

      setStatus("Registering service worker...");
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      setIsRegistered(true);

      const existingSubscription =
        await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setIsSubscribed(true);
        setStatus("Already subscribed to push notifications.");
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setStatus("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY in .env");
        return;
      }

      setStatus("Requesting notification permission...");
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        setStatus("Permission denied. Enable notifications to test push.");
        return;
      }

      setStatus("Subscribing to push notifications...");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toArrayBuffer(urlBase64ToUint8Array(vapidKey)),
      });

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.getKey("p256dh")
              ? btoa(
                  String.fromCharCode(
                    ...new Uint8Array(subscription.getKey("p256dh")!),
                  ),
                )
              : null,
            auth: subscription.getKey("auth")
              ? btoa(
                  String.fromCharCode(
                    ...new Uint8Array(subscription.getKey("auth")!),
                  ),
                )
              : null,
          },
          userId: "test-user",
        }),
      });

      setIsSubscribed(true);
      setStatus("Subscribed successfully. You can now send a test push.");
    } catch (error) {
      console.error(error);
      setStatus(
        "Push registration failed. Check browser console and env keys.",
      );
    }
  }

  async function sendTestPush() {
    if (!isSubscribed) {
      setStatus("Subscribe first before sending a test push.");
      return;
    }

    try {
      setIsSending(true);
      setStatus("Sending test notification...");

      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "test-user",
          title: "KOSEN test notification",
          body: message,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          data: { url: "/" },
        }),
      });

      const result = await response.json();

      if (!response.ok || result?.ok === false) {
        const reason = result?.reason ?? result?.error ?? "Notification send failed";
        throw new Error(reason);
      }

      setStatus("Test notification sent. Check the browser notification tray.");
    } catch (error) {
      console.error(error);
      setStatus(
        error instanceof Error
          ? `Failed to send a test notification: ${error.message}`
          : "Failed to send a test notification. Check VAPID keys and server logs.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 bg-slate-50 p-6 text-slate-900">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
          Push test
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Notification functionality check
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          This page registers the service worker, requests permission,
          subscribes to push, and sends a test notification.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3 text-sm">
          <p>
            <strong>Permission:</strong>{" "}
            {permission === "loading" ? "checking..." : permission}
          </p>
          <p>
            <strong>Service worker:</strong>{" "}
            {isRegistered ? "registered" : "not registered"}
          </p>
          <p>
            <strong>Push subscription:</strong>{" "}
            {isSubscribed ? "active" : "not active"}
          </p>
          <p className="rounded-md bg-slate-100 p-3 text-slate-700">{status}</p>
        </div>

        <div className="mt-5 space-y-4">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none ring-0"
            rows={4}
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={registerAndSubscribe}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white"
            >
              Enable + Subscribe
            </button>

            <button
              type="button"
              onClick={sendTestPush}
              disabled={!isSubscribed || isSending}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSending ? "Sending..." : "Send test notification"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
