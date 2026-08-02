// for other dev this is for testing dont add anything
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

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

      <form action={signOut}>
        <button
          type="submit"
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
