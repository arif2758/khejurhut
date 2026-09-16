"use client";

import { useEffect, useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { signIn } from "next-auth/react";
import type { ILoginInput } from "@/types/auth";

const REMEMBERED_EMAIL_KEY = "gc.remembered-email";

const loginSchema = z.object({
  email: z.string().email("সঠিক ইমেইল অ্যাড্রেস দিন"),
  password: z.string().min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে"),
  rememberMe: z.boolean(),
});

function LoginFormInner() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ILoginInput>({
    resolver: zodResolver(
      loginSchema,
    ) as import("react-hook-form").Resolver<ILoginInput>,
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  useEffect(() => {
    const rememberedEmail = window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (rememberedEmail) {
      setValue("email", rememberedEmail);
      setValue("rememberMe", true);
    }
  }, [setValue]);

  const onSubmit: import("react-hook-form").SubmitHandler<ILoginInput> = async (
    data,
  ) => {
    setIsLoading(true);

    try {
      // সরাসরি NextAuth দিয়ে লগইন করো
      // NextAuth ইতিমধ্যে invalid credentials হ্যান্ডেল করে, প্রি-চেক করার প্রয়োজন নেই
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        toast.error("ইমেইল বা পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।");
        setIsLoading(false);
        return;
      }

      if (data.rememberMe) {
        window.localStorage.setItem(REMEMBERED_EMAIL_KEY, data.email);
      } else {
        window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      // কার্ট মার্জিং background event হিসেবে চলবে (অপেক্ষা করার প্রয়োজন নেই)
      // শুধু cache invalidate করো
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cart-count"] }),
        queryClient.invalidateQueries({ queryKey: ["cart-details"] }),
      ]);

      toast.success("লগিন সফল হয়েছে!");

      router.replace(result?.url || callbackUrl);
      router.refresh();
    } catch {
      toast.error("লগিন করতে সমস্যা হয়েছে");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <div className="w-full max-w-[420px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200/80 dark:border-slate-800 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.08)] rounded-[2rem] p-8 sm:p-10 relative">
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-[26px] font-black tracking-tight text-slate-900 dark:text-white">
              লগইন করুন
            </h1>
            <p className="text-sm font-medium text-slate-400 dark:text-slate-400">
              আপনার অ্যাকাউন্টে প্রবেশ করুন
            </p>
          </div>

          {/* Google Login on Top */}
          <Button
            type="button"
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800 bg-white dark:bg-slate-900/50 font-medium text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2.5 shadow-2xs hover:shadow-xs active:scale-[0.99] transition-all text-sm"
          >
            <Image src="/google.svg" alt="Google" width={18} height={18} />
            Continue with Google
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
            <div className="space-y-1">
              <div className="relative group/field">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-[#240303] transition-colors">
                  <Mail className="size-[18px]" />
                </div>
                <Input
                  {...register("email")}
                  placeholder="Email বা Username"
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
              {errors.password && (
                <p className="text-[11px] font-medium text-rose-500 ml-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register("rememberMe")}
                  className="size-4 rounded border-slate-300 text-[#240303] focus:ring-[#240303]/20 accent-[#240303] cursor-pointer"
                />
                <span className="text-xs font-normal text-slate-600 dark:text-slate-400">
                  মনে রাখুন
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-normal text-slate-600 dark:text-slate-400 hover:text-[#240303] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-sm font-bold shadow-md shadow-[#240303]/20 hover:shadow-lg hover:shadow-[#240303]/30 active:scale-[0.99] transition-all bg-[#240303] hover:bg-[#380606] active:bg-[#150101] text-white border-none mt-2"
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin text-white" />
              ) : (
                "লগইন করুন"
              )}
            </Button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs font-normal text-slate-500">
              অ্যাকাউন্ট নেই?{" "}
              <Link
                href={`/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
                className="text-slate-900 dark:text-white font-bold hover:text-[#240303] transition-colors ml-1"
              >
                রেজিস্টার করুন
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md mx-auto h-125 rounded-[2.5rem] bg-[#FAF7F2]/50 border border-[#2F0C0B]/10 animate-pulse" />
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
