"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface SendNotificationButtonProps {
  targetUserId: string | string[]; // Accepts a single user ID or an array of user IDs
  title: string;
  body: string;
  url?: string;
  children?: ReactNode;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function SendNotificationButton({
  targetUserId,
  title,
  body,
  url = "/",
  children = "Send Notification",
  className = "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors",
  onSuccess,
  onError,
}: SendNotificationButtonProps) {
  const [isSending, setIsSending] = useState(false);

  const handleSendNotification = async () => {
    setIsSending(true);
    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId, // Can be a string or an array of strings
          title,
          body,
          data: { url },
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result?.reason || result?.error || "Failed to send notification");
      }

      onSuccess?.();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Notification request failed";
      console.error("Error sending notification:", errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleSendNotification}
      disabled={isSending}
      variant="default"
      size="sm"
      className={className}
    >
      {isSending ? "Sending..." : children}
    </Button>
  );
}