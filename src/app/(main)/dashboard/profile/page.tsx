// src/app/(main)/dashboard/profile/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { ShieldCheck, User as UserIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "প্রোফাইল সেটিংস | খেজুর হাট | খেজুর",
  description: "আপনার ব্যক্তিগত তথ্য ও একাউন্ট সিকিউরিটি পরিচালনা করুন।",
};

import type { IUser } from "@/types/user";

async function getUserData(userId: string) {
  await dbConnect();
  const user = await User.findById(userId).lean<IUser>();
  if (!user) return null;
  const serialized = JSON.parse(JSON.stringify(user));
  serialized.hasPassword = Boolean(user.password);
  delete serialized.password;
  return serialized;
}



export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await getUserData(session.user.id!);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#240303] dark:hover:text-[#E5B869] transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>ড্যাশবোর্ডে ফিরুন</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <UserIcon className="size-6 sm:size-7 text-[#240303] dark:text-[#E5B869]" />
              প্রোফাইল সেটিংস
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              আপনার ব্যক্তিগত তথ্য, যোগাযোগ ও একাউন্ট সেটিংস পরিচালনা করুন।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold">
              <ShieldCheck className="size-3.5" />
              যাচাইকৃত একাউন্ট
            </span>
          </div>
        </div>
      </div>

      <ProfileForm initialData={user} />
    </div>
  );
}
