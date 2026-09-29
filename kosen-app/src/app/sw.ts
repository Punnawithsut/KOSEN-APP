/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

interface ExtendedNotificationOptions extends NotificationOptions {
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
}

const serwist = new Serwist({
  precacheEntries: [
    ...(self.__SW_MANIFEST || []),
    { url: "/offline", revision: "1" },
  ],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();

self.addEventListener("push", (event) => {
  const defaultPayload = {
    title: "KOSEN",
    body: "You have a new update.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: "kosen-notification",
    data: { url: "/" },
    actions: [{ action: "open", title: "Open app" }],
  };

  const handlePush = async () => {
    let payload = defaultPayload;

    if (event.data) {
      try {
        // event.data.json() is synchronous
        payload = { ...defaultPayload, ...event.data.json() };
      } catch {
        // Fallback if payload was plain string instead of JSON
        payload = { ...defaultPayload, body: event.data.text() };
      }
    }

    const options: ExtendedNotificationOptions = {
      body: payload.body ?? defaultPayload.body,
      icon: payload.icon ?? defaultPayload.icon,
      badge: payload.badge ?? defaultPayload.badge,
      tag: payload.tag ?? defaultPayload.tag,
      data: payload.data ?? defaultPayload.data,
      actions: payload.actions ?? defaultPayload.actions,
    };

    await self.registration.showNotification(
      payload.title ?? defaultPayload.title,
      options as NotificationOptions,
    );
  };

  event.waitUntil(handlePush());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetPath =
    (event.notification.data as { url?: string } | undefined)?.url ?? "/";

  const openApp = async () => {
    // Resolve absolute URL reliably
    const targetUrl = new URL(targetPath, self.location.origin).href;

    const allClients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    const matchingClient = allClients.find((client) => client.url === targetUrl);

    if (matchingClient) {
      await matchingClient.focus();
      return;
    }

    await self.clients.openWindow(targetUrl);
  };

  event.waitUntil(openApp());
});