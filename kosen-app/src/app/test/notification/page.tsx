import { notFound } from "next/navigation";
import NotificationTestClient from "./notification-test-client";

export default function NotificationTestPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <NotificationTestClient />;
}
