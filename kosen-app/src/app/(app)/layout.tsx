import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { RequireStandalone } from "@/components/require-standalone";
import { isLoggedIn } from "@/lib/auth/role";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isLoggedIn())) {
    redirect("/login");
  }
  //return children //comment this and uncomment below on production @everyone
  //return <RequireStandalone>{children}</RequireStandalone>;
  return (
    <RequireStandalone>
      <div className="flex min-h-screen flex-col">
        <Navbar/>
          <main className="flex-1">{children}</main>
        <Footer/>
        <div
          className="h-16 md:hidden"
          aria-hidden
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        />
      </div>
    </RequireStandalone>
  );
}