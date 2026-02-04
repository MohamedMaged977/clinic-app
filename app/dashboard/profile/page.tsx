import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { ProfileForm } from "../_components/ProfileForm";

export default async function ProfilePage() {
  const { profile } = await requireAuth();

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/dashboard" className="text-sm text-teal-600 hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-black">My profile</h1>
      <p className="mt-1 text-sm text-black">Set your name so it appears in appointments and schedules.</p>
      <ProfileForm profile={profile} />
    </div>
  );
}
