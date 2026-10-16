import Link from "next/link";

// TODO: replace with the real announcement detail screen (banner, body,
// Download / More info buttons, image gallery). For now this exists purely so
// the `more` pill on the list does not land on a 404.
export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 bg-bg-primary p-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black-5">
        <p className="text-xs font-medium tracking-[0.2em] text-orange-secondary uppercase">
          Announcement
        </p>
        <h1 className="mt-2 text-xl font-semibold text-black-1">
          Detail view coming soon
        </h1>
        <p className="mt-3 text-sm text-black-3">
          Announcement ID: <span className="text-black-2">{id}</span>
        </p>
        <Link
          href="/announcement"
          className="mt-4 inline-block text-sm text-blue-secondary underline underline-offset-2"
        >
          Back to announcements
        </Link>
      </div>
    </main>
  );
}
