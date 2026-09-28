import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

const storeDirectory = path.join(process.cwd(), "data");
const storeFilePath = path.join(storeDirectory, "push-subscriptions.json");

function readStore(): Record<string, PushSubscriptionPayload> {
  try {
    if (!existsSync(storeFilePath)) {
      return {};
    }

    const contents = readFileSync(storeFilePath, "utf8");
    const parsed = JSON.parse(contents) as Record<
      string,
      PushSubscriptionPayload
    >;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.error("Failed to read push subscription store:", error);
    return {};
  }
}

function writeStore(store: Record<string, PushSubscriptionPayload>) {
  try {
    mkdirSync(storeDirectory, { recursive: true });
    writeFileSync(storeFilePath, JSON.stringify(store, null, 2));
  } catch (error) {
    console.error("Failed to write push subscription store:", error);
  }
}

export function saveSubscription(
  userId: string,
  payload: PushSubscriptionPayload,
) {
  const store = readStore();
  store[userId] = payload;
  writeStore(store);
}

export function getSubscriptionForUser(userId: string) {
  return readStore()[userId] ?? null;
}

export function getAllSubscriptions() {
  return Object.values(readStore());
}

export function deleteSubscription(userId: string) {
  const store = readStore();
  delete store[userId];
  writeStore(store);
}
