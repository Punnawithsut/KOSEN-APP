export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

const subscriptions = new Map<string, PushSubscriptionPayload>();

export function saveSubscription(userId: string, payload: PushSubscriptionPayload) {
  subscriptions.set(userId, payload);
}

export function getSubscriptionForUser(userId: string) {
  return subscriptions.get(userId) ?? null;
}

export function getAllSubscriptions() {
  return Array.from(subscriptions.values());
}

export function deleteSubscription(userId: string) {
  subscriptions.delete(userId);
}
