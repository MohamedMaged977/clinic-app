import { requireAuth } from "@/lib/auth";
import { DashboardNav } from "./_components/DashboardNav";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const { profile } = await requireAuth();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <DashboardNav profile={profile} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
