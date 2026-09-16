// src/components/dashboard/ProfileForm.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  Loader2,
  ShieldCheck,
  Lock,
  KeyRound,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { changeOrSetPassword } from "@/actions/auth";

interface UserProfile {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  image?: string | null;
  hasPassword?: boolean;
}

export function ProfileForm({ initialData }: { initialData: UserProfile }) {
  const { update: updateSession } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    image: initialData?.image || "",
  });

  // Password Management States
  const [hasPassword, setHasPassword] = useState(Boolean(initialData?.hasPassword));
  const [passLoading, setPassLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        await updateSession();
        toast.success("প্রোফাইল সফলভাবে আপডেট হয়েছে");
        router.refresh();
      } else {
        toast.error(data.error || "প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে");
      }
    } catch {
      toast.error("সার্ভার এরর, পুনরায় চেষ্টা করুন");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না");
      return;
    }

    if (hasPassword && !currentPassword) {
      toast.error("বর্তমান পাসওয়ার্ড প্রদান করুন");
      return;
    }

    setPassLoading(true);
    try {
      const result = await changeOrSetPassword({
        currentPassword: hasPassword ? currentPassword : undefined,
        newPassword,
      });

      if (result.success) {
        toast.success(result.message);
        setHasPassword(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        await updateSession();
        router.refresh();
      } else {
        toast.error(result.error || "পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে");
      }
    } catch {
      toast.error("পাসওয়ার্ড আপডেটে সমস্যা হয়েছে");
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image & Summary Card */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
          <div className="relative group shrink-0">
            <div className="relative size-24 sm:size-28 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-2xs">
              {formData.image ? (
                <Image
                  src={formData.image}
                  alt={formData.name || "Profile"}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              ) : (
                <div className="size-full flex items-center justify-center bg-[#fdf6f0] dark:bg-slate-800 text-[#240303] dark:text-[#E5B869]">
                  <User className="size-10" />
                </div>
              )}
            </div>

            <button
              type="button"
              className="absolute -bottom-1 -right-1 size-8 rounded-lg bg-[#240303] text-white flex items-center justify-center shadow-xs hover:bg-[#3a0808] transition-colors cursor-pointer"
              onClick={() =>
                toast.info("ছবি আপলোডের ফিচার খুব শীঘ্রই আসছে!")
              }
              title="ছবি পরিবর্তন করুন"
            >
              <Camera className="size-4" />
            </button>
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              প্রোফাইল ছবি
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              আপনার একাউন্টে ব্যবহারের জন্য একটি স্পষ্ট ছবি নির্বাচন করুন। (JPEG অথবা PNG, সর্বোচ্চ ২ মেগাবাইট)
            </p>
          </div>
        </div>

        {/* Form Fields Card */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            ব্যক্তিগত তথ্য
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="size-3.5 text-slate-400" />
                আপনার পূর্ণ নাম *
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                className="h-10 rounded-lg text-xs sm:text-sm"
                placeholder="পূর্ণ নাম লিখুন"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="size-3.5 text-slate-400" />
                ইমেইল এড্রেস
              </label>
              <div className="relative">
                <Input
                  value={formData.email}
                  disabled
                  className="h-10 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-not-allowed pr-9"
                />
                <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-600" />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="size-3.5 text-slate-400" />
                মোবাইল নম্বর
              </label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, phone: e.target.value }))
                }
                className="h-10 rounded-lg text-xs sm:text-sm max-w-sm"
                placeholder="017XXXXXXXX"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="submit"
              disabled={loading}
              className="h-10 px-6 rounded-lg font-bold text-xs sm:text-sm bg-[#240303] hover:bg-[#3a0808] text-white shadow-xs transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  সংরক্ষণ করা হচ্ছে...
                </>
              ) : (
                <>
                  <Save className="size-4 mr-1.5" />
                  পরিবর্তন সংরক্ষণ করুন
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Password Management Card */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="size-4 text-[#240303] dark:text-[#E5B869]" />
              {hasPassword ? "পাসওয়ার্ড পরিবর্তন করুন" : "পাসওয়ার্ড সেট করুন"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {hasPassword
                ? "আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করতে নিয়মিত পাসওয়ার্ড পরিবর্তন করুন।"
                : "আপনার অ্যাকাউন্টটি গুগল দিয়ে তৈরি। আপনি চাইলে সরাসরি লগইন করতে পাসওয়ার্ড সেট করতে পারেন।"}
            </p>
          </div>
          {hasPassword ? (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-md">
              <CheckCircle2 className="size-3.5" /> পাসওয়ার্ড সক্রিয়
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-md">
              <Info className="size-3.5" /> শুধু গুগল লগইন
            </span>
          )}
        </div>

        {!hasPassword && (
          <div className="p-3.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-2.5">
            <Info className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">সুবিধা:</strong> পাসওয়ার্ড সেট করলে পরবর্তীতে আপনি গুগল দিয়েও লগইন করতে পারবেন, আবার সরাসরি ইমেইল ও পাসওয়ার্ড দিয়েও লগইন করতে পারবেন।
            </div>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          {hasPassword && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="size-3.5 text-slate-400" />
                বর্তমান পাসওয়ার্ড *
              </label>
              <Input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="আপনার বর্তমান পাসওয়ার্ড দিন"
                className="h-10 rounded-lg text-xs sm:text-sm"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lock className="size-3.5 text-slate-400" />
              নতুন পাসওয়ার্ড * (কমপক্ষে ৮ অক্ষর)
            </label>
            <Input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="কমপক্ষে ৮ অক্ষরের নতুন পাসওয়ার্ড"
              className="h-10 rounded-lg text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lock className="size-3.5 text-slate-400" />
              নতুন পাসওয়ার্ড নিশ্চিত করুন *
            </label>
            <Input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="নতুন পাসওয়ার্ডটি পুনরায় লিখুন"
              className="h-10 rounded-lg text-xs sm:text-sm"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={passLoading}
              className="h-10 px-6 rounded-lg font-bold text-xs sm:text-sm bg-[#240303] hover:bg-[#3a0808] text-white shadow-xs transition-all cursor-pointer"
            >
              {passLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  সংরক্ষণ হচ্ছে...
                </>
              ) : (
                <>{hasPassword ? "পাসওয়ার্ড আপডেট করুন" : "পাসওয়ার্ড সেট করুন"}</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

