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

    try {
      if (event.data) {
        const rawText = await event.data.text();
        if (rawText && rawText.trim()) {
          try {
            payload = JSON.parse(rawText) as typeof defaultPayload;
          } catch {
            payload = { ...defaultPayload, body: rawText };
          }
        }
      }
    } catch (error) {
      console.warn(
        "Push payload was not valid JSON; using default notification payload.",
        error,
      );
    }

    const options = {
      body: payload.body ?? defaultPayload.body,
      icon: payload.icon ?? defaultPayload.icon,
      badge: payload.badge ?? defaultPayload.badge,
      tag: payload.tag ?? defaultPayload.tag,
      data: payload.data ?? defaultPayload.data,
      actions: payload.actions ?? defaultPayload.actions,
    };

    await self.registration.showNotification(
      payload.title ?? defaultPayload.title,
      options,
    );
  };

  event.waitUntil(handlePush());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url =
    (event.notification.data as { url?: string } | undefined)?.url ?? "/";

  const openApp = async () => {
    const allClients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    const matchingClient = allClients.find(
      (client) => client.url === self.location.origin + url,
    );

    if (matchingClient) {
      await matchingClient.focus();
      return;
    }

    await self.clients.openWindow(url);
  };

  event.waitUntil(openApp());
});
