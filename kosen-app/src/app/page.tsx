import { redirect } from "next/navigation";

import { isLoggedIn } from "@/lib/auth/role";

export default async function Home() {
  if (await isLoggedIn()) {
    redirect("/announcement");
  }

  redirect("/login");
}
