export type NotificationAction = {
  action: string;
  title: string;
  icon?: string;
};

export type NotificationPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
};

export function supportsPushNotifications(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const normalizedBase64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(normalizedBase64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export async function registerPushServiceWorker(
  serviceWorkerUrl = "/sw.js",
  scope = "/",
): Promise<ServiceWorkerRegistration | null> {
  if (!supportsPushNotifications()) {
    return null;
  }

  return navigator.serviceWorker.register(serviceWorkerUrl, {
    scope,
    updateViaCache: "none",
  });
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!supportsPushNotifications()) {
    return "denied";
  }

  return Notification.requestPermission();
}

export async function subscribeToPushNotifications(
  vapidPublicKey: string | undefined,
  serviceWorkerUrl = "/sw.js",
): Promise<PushSubscription | null> {
  if (!supportsPushNotifications()) {
    return null;
  }

  if (!vapidPublicKey) {
    throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured.");
  }

  const registration = await registerPushServiceWorker(serviceWorkerUrl);

  if (!registration) {
    return null;
  }

  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription) {
    return existingSubscription;
  }

  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: toArrayBuffer(applicationServerKey),
  });
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!supportsPushNotifications()) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return false;
  }

  return subscription.unsubscribe();
}

export function serializePushSubscription(
  subscription: PushSubscription,
): {
  endpoint: string;
  keys: {
    p256dh: string | null;
    auth: string | null;
  };
} {
  const p256dh = subscription.getKey("p256dh");
  const auth = subscription.getKey("auth");

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: p256dh ? arrayBufferToBase64(p256dh) : null,
      auth: auth ? arrayBufferToBase64(auth) : null,
    },
  };
}

export async function savePushSubscription(
  subscription: PushSubscription,
  extraData: Record<string, unknown> = {},
): Promise<Response> {
  const response = await fetch("/api/notifications/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...serializePushSubscription(subscription),
      ...extraData,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to save push subscription.");
  }

  return response;
}

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";

  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });

  return window.btoa(binary);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}
