export default function TestPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-xl font-semibold">
        You are running on standalone app
      </h1>
      <p className="text-muted-foreground">
        Download to access this page
      </p>
    </div>
  );
}