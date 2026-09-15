"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signUp } from "@/actions/auth";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

const registerSchema = z.object({
  name: z.string().min(3, "নাম কমপক্ষে ৩ অক্ষর হওয়া উচিত"),
  email: z.string().email("সঠিক ইমেইল অ্যাড্রেস দিন"),
  password: z
    .string()
    .min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে")
    .regex(/[A-Z]/, "পাসওয়ার্ডে কমপক্ষে একটি বড় হাতের অক্ষর (A-Z) থাকতে হবে")
    .regex(/[0-9]/, "পাসওয়ার্ডে কমপক্ষে একটি সংখ্যা (0-9) থাকতে হবে"),
});

type RegisterInput = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const result = await signUp(data);
      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
      } else {
        toast.success("রেজিস্ট্রেশন সফল হয়েছে! লগইন হচ্ছে...");

        // অটোমেটিক লগইন
        const loginResult = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
          callbackUrl,
        });

        if (loginResult?.error) {
          toast.error("স্বয়ংক্রিয় লগইন ব্যর্থ হয়েছে। দয়া করে লগইন করুন।");
          router.push("/login");
        } else {
          router.replace(loginResult?.url || callbackUrl);
          router.refresh();
        }
      }
    } catch (error) {
      toast.error(`কিছু ভুল হয়েছে। আবার চেষ্টা করুন। ${error}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white/85 dark:bg-[#1A0505]/80 backdrop-blur-xl border border-[#2F0C0B]/12 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(42,1,1,0.08)] rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden group">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 size-36 bg-[#C59B27]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 size-36 bg-[#1A0101]/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

        <div className="relative space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-[#120000] dark:text-foreground">
              রেজিস্ট্রেশন করুন
            </h1>
            <p className="text-sm font-medium text-[#5C4D4A] dark:text-[#A89A97]">
              কেনাকাটা শুরু করতে নতুন অ্যাকাউন্ট খুলুন
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <div className="relative group/field">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C7A77] group-focus-within/field:text-[#1A0101] dark:group-focus-within/field:text-[#D4A373] transition-colors">
                  <User className="size-4.5" />
                </div>
                <Input
                  {...register("name")}
                  placeholder="আপনার নাম"
                  className={cn(
                    "h-14 pl-12 pr-4 bg-[#FAF7F2]/80 dark:bg-black/20 border-[#2F0C0B]/15 dark:border-white/10 rounded-2xl focus:bg-white dark:focus:bg-black/40 focus:border-[#C59B27] focus:ring-4 ring-[#C59B27]/15 transition-all text-sm font-bold text-[#120000] dark:text-white placeholder:text-[#8C7A77]/70",
                    errors.name &&
                      "border-rose-500 focus:ring-rose-500/10 bg-rose-50/30",
                  )}
                />
              </div>
              {errors.name && (
                <p className="text-[11px] font-bold text-rose-500 ml-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <div className="relative group/field">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C7A77] group-focus-within/field:text-[#1A0101] dark:group-focus-within/field:text-[#D4A373] transition-colors">
                  <Mail className="size-4.5" />
                </div>
                <Input
                  {...register("email")}
                  placeholder="ইমেইল অ্যাড্রেস"
                  className={cn(
                    "h-14 pl-12 pr-4 bg-[#FAF7F2]/80 dark:bg-black/20 border-[#2F0C0B]/15 dark:border-white/10 rounded-2xl focus:bg-white dark:focus:bg-black/40 focus:border-[#C59B27] focus:ring-4 ring-[#C59B27]/15 transition-all text-sm font-bold text-[#120000] dark:text-white placeholder:text-[#8C7A77]/70",
                    errors.email &&
                      "border-rose-500 focus:ring-rose-500/10 bg-rose-50/30",
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] font-bold text-rose-500 ml-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="relative group/field">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C7A77] group-focus-within/field:text-[#1A0101] dark:group-focus-within/field:text-[#D4A373] transition-colors">
                  <Lock className="size-4.5" />
                </div>
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="পাসওয়ার্ড লিখুন"
                  className={cn(
                    "h-14 pl-12 pr-12 bg-[#FAF7F2]/80 dark:bg-black/20 border-[#2F0C0B]/15 dark:border-white/10 rounded-2xl focus:bg-white dark:focus:bg-black/40 focus:border-[#C59B27] focus:ring-4 ring-[#C59B27]/15 transition-all text-sm font-bold text-[#120000] dark:text-white placeholder:text-[#8C7A77]/70",
                    errors.password &&
                      "border-rose-500 focus:ring-rose-500/10 bg-rose-50/30",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8C7A77] hover:text-[#120000] dark:hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="size-4.5" />
                  ) : (
                    <Eye className="size-4.5" />
                  )}
                </button>
              </div>
              <div className="flex items-start gap-2 pt-1.5 border-t border-[#2F0C0B]/10 dark:border-white/10 mt-2">
                <ShieldCheck className="size-3.5 text-[#C59B27] shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium text-[#5C4D4A] dark:text-[#A89A97] leading-tight">
                  পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে, বড় হাতের অক্ষর ও সংখ্যা থাকতে হবে
                </p>
              </div>
              {errors.password && (
                <p className="text-[11px] font-bold text-rose-500 ml-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              disabled={isLoading}
              className="w-full h-14 rounded-2xl text-base font-black shadow-xl shadow-[#1A0101]/20 hover:shadow-2xl hover:shadow-[#1A0101]/30 active:scale-[0.98] transition-all bg-gradient-to-r from-[#1A0101] via-[#240303] to-[#1E0202] hover:from-[#240303] hover:to-[#2D0505] text-[#FAF6F0] border-none gap-2"
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin text-[#D4A373]" />
              ) : (
                <>
                  রেজিস্ট্রেশন সম্পন্ন করুন
                  <ArrowRight className="size-5 text-[#D4A373]" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs font-bold text-[#8C7A77]">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
              <Link
                href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
                className="text-[#1A0101] dark:text-[#E5B869] font-black hover:underline underline-offset-4 decoration-2 ml-1"
              >
                লগইন করুন
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
