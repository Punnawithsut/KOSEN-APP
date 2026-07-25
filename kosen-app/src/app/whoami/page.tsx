import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function WhoamiPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-xl font-semibold">You&apos;re signed in</h1>
      <p className="text-muted-foreground">{data.user.email}</p>
    </div>
  );
}