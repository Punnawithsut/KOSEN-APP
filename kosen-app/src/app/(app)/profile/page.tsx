export default function ProfilePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-6 text-slate-900">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
          Profile
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Profile module</h1>
        <p className="mt-3 text-sm text-slate-600">
          This is the dedicated Profile section.
        </p>
      </div>
    </main>
  );
}
