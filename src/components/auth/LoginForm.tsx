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
    <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white/85 dark:bg-[#1A0505]/80 backdrop-blur-xl border border-[#2F0C0B]/12 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(42,1,1,0.08)] rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 size-36 bg-[#C59B27]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 size-36 bg-[#1A0101]/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

        <div className="relative space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-[#120000] dark:text-foreground">
              লগইন করুন
            </h1>
            <p className="text-sm font-medium text-[#5C4D4A] dark:text-[#A89A97]">
              আপনার অ্যাকাউন্টে প্রবেশ করতে তথ্য দিন
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <div className="relative group/field">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C7A77] group-focus-within/field:text-[#1A0101] dark:group-focus-within/field:text-[#D4A373] transition-colors">
                  <Mail className="size-4" />
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

            <div className="space-y-1.5">
              <div className="relative group/field">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C7A77] group-focus-within/field:text-[#1A0101] dark:group-focus-within/field:text-[#D4A373] transition-colors">
                  <Lock className="size-4" />
                </div>
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="পাসওয়ার্ড"
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
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] font-bold text-rose-500 ml-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register("rememberMe")}
                  className="size-4 rounded-md border-[#2F0C0B]/20 text-[#1A0101] focus:ring-[#C59B27]/20 accent-[#1A0101] cursor-pointer"
                />
                <span className="text-xs font-bold text-[#5C4D4A] dark:text-[#A89A97] group-hover:text-[#120000] dark:group-hover:text-white transition-colors">
                  মনে রাখুন
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-[#1A0101] dark:text-[#E5B869] hover:underline underline-offset-4 decoration-2"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>

            <Button
              disabled={isLoading}
              className="w-full h-14 rounded-2xl text-base font-black shadow-xl shadow-[#1A0101]/20 hover:shadow-2xl hover:shadow-[#1A0101]/30 active:scale-[0.98] transition-all bg-gradient-to-r from-[#1A0101] via-[#240303] to-[#1E0202] hover:from-[#240303] hover:to-[#2D0505] text-[#FAF6F0] border-none gap-2"
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin text-[#D4A373]" />
              ) : (
                <>
                  লগইন
                  <ArrowRight className="size-5 text-[#D4A373]" />
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#2F0C0B]/12 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
              <span className="bg-[#FAF7F2] dark:bg-[#1A0505] px-3 py-0.5 rounded-full text-[#8C7A77] border border-[#2F0C0B]/8">
                অথবা
              </span>
            </div>
          </div>

          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-14 rounded-2xl border-[#2F0C0B]/15 dark:border-white/10 hover:bg-[#FAF7F2] dark:hover:bg-white/5 bg-white/80 dark:bg-black/20 text-[#120000] dark:text-white font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            <Image src="/google.svg" alt="Google" width={20} height={20} />
            Google দিয়ে এগিয়ে যান
          </Button>

          <div className="text-center pt-2">
            <p className="text-xs font-bold text-[#8C7A77]">
              নতুন গ্রাহক?{" "}
              <Link
                href={`/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
                className="text-[#1A0101] dark:text-[#E5B869] font-black hover:underline underline-offset-4 decoration-2 ml-1"
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
