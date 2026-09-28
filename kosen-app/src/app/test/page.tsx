import Link from "next/link";

export default function TestIndexPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 bg-slate-50 p-6 text-slate-900">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
          Test area
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Notification debugging</h1>
        <p className="mt-3 text-sm text-slate-600">
          Use the page below to test push subscription and browser notification
          behavior.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          href="/test/notification"
          className="inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white"
        >
          Open notification test page
        </Link>
      </div>
    </main>
  );
}
