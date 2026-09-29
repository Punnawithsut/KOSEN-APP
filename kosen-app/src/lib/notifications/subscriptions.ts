import "server-only";
import { db } from "@/db/client";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function saveSubscription(
  userId: string,
  payload: PushSubscriptionPayload,
) {
  await db
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint: payload.endpoint,
      p256dh: payload.keys.p256dh,
      auth: payload.keys.auth,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId,
        p256dh: payload.keys.p256dh,
        auth: payload.keys.auth,
        updatedAt: new Date(),
      },
    });
}

export async function getSubscriptionForUser(
  userId: string,
): Promise<PushSubscriptionPayload[]> {
  const records = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  return records.map((record) => ({
    endpoint: record.endpoint,
    keys: {
      p256dh: record.p256dh,
      auth: record.auth,
    },
  }));
}

export async function getAllSubscriptions(): Promise<PushSubscriptionPayload[]> {
  const records = await db.select().from(pushSubscriptions);

  return records.map((record) => ({
    endpoint: record.endpoint,
    keys: {
      p256dh: record.p256dh,
      auth: record.auth,
    },
  }));
}

export async function deleteSubscription(endpoint: string) {
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));
}

export async function deleteUserSubscriptions(userId: string) {
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
}