"use client";

import { useSyncExternalStore } from "react";
import { supportsPushNotifications } from "@/lib/notifications/push";

const PERMISSION_CHANGE_EVENT = "notification-permission-change";

function subscribe(callback: () => void) {
  window.addEventListener("focus", callback);
  window.addEventListener(PERMISSION_CHANGE_EVENT, callback);
  document.addEventListener("visibilitychange", callback);

  return () => {
    window.removeEventListener("focus", callback);
    window.removeEventListener(PERMISSION_CHANGE_EVENT, callback);
    document.removeEventListener("visibilitychange", callback);
  };
}

function getSupportSnapshot() {
  return supportsPushNotifications();
}

function getPermissionSnapshot(): NotificationPermission | "unsupported" {
  return typeof Notification === "undefined"
    ? "unsupported"
    : Notification.permission;
}

function getServerPermissionSnapshot(): "loading" {
  return "loading";
}

export function usePushNotificationSupport() {
  return useSyncExternalStore(subscribe, getSupportSnapshot, () => false);
}

export function useNotificationPermission() {
  return useSyncExternalStore(
    subscribe,
    getPermissionSnapshot,
    getServerPermissionSnapshot,
  );
}

export function refreshNotificationPermission() {
  window.dispatchEvent(new Event(PERMISSION_CHANGE_EVENT));
}