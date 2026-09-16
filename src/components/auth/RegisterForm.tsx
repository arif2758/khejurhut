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
import Image from "next/image";
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
    <div className="w-full max-w-[420px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200/80 dark:border-slate-800 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.08)] rounded-[2rem] p-8 sm:p-10 relative">
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-[26px] font-black tracking-tight text-slate-900 dark:text-white">
              রেজিস্টার করুন
            </h1>
            <p className="text-sm font-medium text-slate-400 dark:text-slate-400">
              নতুন অ্যাকাউন্ট তৈরি করুন
            </p>
          </div>

          {/* Google Sign up on Top */}
          <Button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            variant="outline"
            className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800 bg-white dark:bg-slate-900/50 font-medium text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2.5 shadow-2xs hover:shadow-xs active:scale-[0.99] transition-all text-sm"
          >
            <Image src="/google.svg" alt="Google" width={18} height={18} />
            Sign up with Google
          </Button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200/80 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs font-normal">
              <span className="bg-white dark:bg-[#1a1f2c] px-3 text-slate-400">
                অথবা
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <div className="relative group/field">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-[#240303] transition-colors">
                  <User className="size-[18px]" />
                </div>
                <Input
                  {...register("name")}
                  placeholder="Full name"
                  className={cn(
                    "h-12 pl-11 pr-4 bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/90 dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#240303] focus:ring-2 focus:ring-[#240303]/15 transition-all text-sm font-normal text-slate-800 dark:text-white placeholder:text-slate-400",
                    errors.name &&
                      "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 bg-rose-50/30",
                  )}
                />
              </div>
              {errors.name && (
                <p className="text-[11px] font-medium text-rose-500 ml-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <div className="relative group/field">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-[#240303] transition-colors">
                  <Mail className="size-[18px]" />
                </div>
                <Input
                  {...register("email")}
                  placeholder="Email"
                  className={cn(
                    "h-12 pl-11 pr-4 bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/90 dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#240303] focus:ring-2 focus:ring-[#240303]/15 transition-all text-sm font-normal text-slate-800 dark:text-white placeholder:text-slate-400",
                    errors.email &&
                      "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 bg-rose-50/30",
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] font-medium text-rose-500 ml-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="relative group/field">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-[#240303] transition-colors">
                  <Lock className="size-[18px]" />
                </div>
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className={cn(
                    "h-12 pl-11 pr-11 bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/90 dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#240303] focus:ring-2 focus:ring-[#240303]/15 transition-all text-sm font-normal text-slate-800 dark:text-white placeholder:text-slate-400",
                    errors.password &&
                      "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 bg-rose-50/30",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="size-[18px]" />
                  ) : (
                    <Eye className="size-[18px]" />
                  )}
                </button>
              </div>
              <div className="py-1">
                <p className="text-[11px] font-normal text-slate-400 text-center leading-tight">
                  অন্তত ৮ টি অক্ষর, একটি বড় হাতের অক্ষর ও একটি নাম্বার থাকতে হবে
                </p>
              </div>
              {errors.password && (
                <p className="text-[11px] font-medium text-rose-500 ml-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-sm font-bold shadow-md shadow-[#240303]/20 hover:shadow-lg hover:shadow-[#240303]/30 active:scale-[0.99] transition-all bg-[#240303] hover:bg-[#380606] active:bg-[#150101] text-white border-none mt-2"
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin text-white" />
              ) : (
                "রেজিস্টার করুন"
              )}
            </Button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs font-normal text-slate-500">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
              <Link
                href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
                className="text-slate-900 dark:text-white font-bold hover:text-[#240303] transition-colors ml-1"
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
