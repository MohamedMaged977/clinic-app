"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/db/types";

const navByRole: Record<string, { label: string; href: string }[]> = {
  admin: [
    { label: "Overview", href: "/dashboard" },
    { label: "Branches", href: "/dashboard/branches" },
    { label: "Staff", href: "/dashboard/staff" },
    { label: "Appointments", href: "/dashboard/appointments" },
  ],
  doctor: [
    { label: "My Schedule", href: "/dashboard" },
    { label: "Appointments", href: "/dashboard/appointments" },
    { label: "Patients", href: "/dashboard/patients" },
  ],
  receptionist: [
    { label: "Schedule", href: "/dashboard" },
    { label: "Appointments", href: "/dashboard/appointments" },
    { label: "Patients", href: "/dashboard/patients" },
  ],
};

export function DashboardNav({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = navByRole[profile.role] ?? navByRole.receptionist;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/dashboard" className="text-lg font-semibold text-teal-700">
          Clinic Booking
        </Link>
        <nav className="flex items-center gap-1">
          {links.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                  ? "bg-teal-50 text-teal-700"
                  : "text-[#000000] hover:bg-slate-100 hover:text-[#000000]"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/profile" className="text-sm text-black hover:underline">
            {profile.full_name || profile.email} ({profile.role})
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md px-3 py-1.5 text-sm text-black hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
