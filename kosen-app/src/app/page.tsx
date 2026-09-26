import { PushNotificationToggle } from "@/components/push-notification-toggle";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-12 text-slate-900">
      <div className="w-full max-w-xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-blue-600">
            KOSEN App
          </p>
          <h1 className="text-2xl font-semibold">Push notifications</h1>
          <p className="text-sm text-slate-600">
            Enable browser notifications so appointment reminders and updates can reach users even when the app is not open.
          </p>
        </div>

        <PushNotificationToggle />
      </div>
    </main>
  );
}
