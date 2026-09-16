// src/app/(main)/dashboard/addresses/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { IUser } from "@/types/user";
import { AddressManager } from "@/components/dashboard/AddressManager";
import { MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "ডেলিভারি ঠিকানাসমূহ | খেজুর হাট | খেজুর",
  description: "আপনার শিপিং ও ডেলিভারি ঠিকানা সংরক্ষণ ও পরিচালনা করুন।",
};

async function getAddresses(userId: string) {
  await dbConnect();
  const user = await User.findById(userId)
    .select("addresses")
    .lean<Pick<IUser, "addresses">>();

  return user?.addresses || [];
}

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const addresses = await getAddresses(session.user.id);
  const serializableAddresses = addresses.map((addr) => ({
    ...addr,
    _id: addr._id.toString(),
    createdAt: addr.createdAt.toISOString(),
    updatedAt: addr.updatedAt.toISOString(),
  }));

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
              <MapPin className="size-6 sm:size-7 text-[#240303] dark:text-[#E5B869]" />
              ডেলিভারি ঠিকানাসমূহ
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              দ্রুত চেকআউট ও ডেলিভারির জন্য আপনার ঠিকানাগুলো সংরক্ষণ করে রাখুন।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#fdf6f0] dark:bg-slate-800 text-[#240303] dark:text-[#E5B869] border border-[#240303]/10 dark:border-slate-700">
              মোট ঠিকানা: {serializableAddresses.length} টি
            </span>
          </div>
        </div>
      </div>

      <AddressManager initialAddresses={serializableAddresses} />
    </div>
  );
}
