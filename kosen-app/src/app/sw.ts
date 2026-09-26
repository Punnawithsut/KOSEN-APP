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
  const payload = event.data?.json?.() ?? {
    title: "KOSEN",
    body: "You have a new update.",
    icon: "/icons/icon-192.png",
    tag: "kosen-notification",
    data: { url: "/" },
  };

  const options = {
    body: payload.body ?? "You have a new update.",
    icon: payload.icon ?? "/icons/icon-192.png",
    badge: payload.badge ?? "/icons/icon-192.png",
    tag: payload.tag ?? "kosen-notification",
    data: payload.data ?? { url: "/" },
    actions: payload.actions ?? [{ action: "open", title: "Open app" }],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "KOSEN", options),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = (event.notification.data as { url?: string } | undefined)?.url ?? "/";

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