export default function OfflinePage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-xl font-semibold">
        You are offline
    </h1>
      <p className="text-muted-foreground">
        Check your connection — cached pages are still available from the menu.
      </p>
    </div>
  );
}