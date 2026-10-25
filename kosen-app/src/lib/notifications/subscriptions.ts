import "server-only";
import { db } from "@/db/client";
import { pushSubscriptions } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

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
      deletedAt: null,
      deletedBy: null,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId,
        p256dh: payload.keys.p256dh,
        auth: payload.keys.auth,
        updatedAt: new Date(),
        deletedAt: null,
        deletedBy: null,
      },
    });
}

export async function getSubscriptionForUser(
  userId: string,
): Promise<PushSubscriptionPayload[]> {
  const records = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        isNull(pushSubscriptions.deletedAt),
      ),
    );

  return records.map((record) => ({
    endpoint: record.endpoint,
    keys: {
      p256dh: record.p256dh,
      auth: record.auth,
    },
  }));
}

export async function getAllSubscriptions(): Promise<PushSubscriptionPayload[]> {
  const records = await db
    .select()
    .from(pushSubscriptions)
    .where(isNull(pushSubscriptions.deletedAt));

  return records.map((record) => ({
    endpoint: record.endpoint,
    keys: {
      p256dh: record.p256dh,
      auth: record.auth,
    },
  }));
}

export async function deleteSubscription(endpoint: string) {
  const deletedAt = new Date();
  await db
    .update(pushSubscriptions)
    .set({ deletedAt, updatedAt: deletedAt })
    .where(
      and(
        eq(pushSubscriptions.endpoint, endpoint),
        isNull(pushSubscriptions.deletedAt),
      ),
    );
}

export async function deleteSubscriptionForUser(
  userId: string,
  endpoint: string,
) {
  const deletedAt = new Date();
  await db
    .update(pushSubscriptions)
    .set({ deletedAt, updatedAt: deletedAt })
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint),
        isNull(pushSubscriptions.deletedAt),
      ),
    );
}

export async function deleteUserSubscriptions(userId: string) {
  const deletedAt = new Date();
  await db
    .update(pushSubscriptions)
    .set({ deletedAt, updatedAt: deletedAt })
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        isNull(pushSubscriptions.deletedAt),
      ),
    );
}