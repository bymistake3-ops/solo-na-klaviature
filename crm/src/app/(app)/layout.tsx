import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex">
      <Sidebar userName={session.user.name ?? session.user.email ?? "—"} />
      <div className="flex-1 min-w-0">
        <MobileNav />
        <main className="max-w-[1200px] mx-auto px-5 md:px-8 py-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
