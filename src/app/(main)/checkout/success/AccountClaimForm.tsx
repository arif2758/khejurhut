"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowRight, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const ClaimSchema = z.object({
  email: z.string().email("সঠিক ইমেইল দিন"),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
});

type ClaimValues = z.infer<typeof ClaimSchema>;

export function AccountClaimForm({ orderNumber }: { orderNumber: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClaimValues>({
    resolver: zodResolver(ClaimSchema),
  });

  const onSubmit = async (data: ClaimValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/claim-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, orderNumber }),
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "একাউন্ট তৈরি করতে সমস্যা হয়েছে");
        return;
      }

      toast.success("সফলভাবে একাউন্ট তৈরি হয়েছে!");
      
      // Auto login after claim
      const signInResult = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (signInResult?.error) {
        toast.error("স্বয়ংক্রিয়ভাবে লগিন হতে সমস্যা হয়েছে, অনুগ্রহ করে লগিন করুন।");
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh(); // Refresh to update server components with new auth state
      }
    } catch (error) {
      toast.error("সার্ভার এরর, একটু পর আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 max-w-lg mx-auto text-left space-y-5 shadow-xs">
      <div className="flex items-center gap-3.5 pb-3.5 border-b border-slate-100 dark:border-slate-800">
        <div className="size-10 rounded-lg bg-[#fdf6f0] dark:bg-slate-800 flex items-center justify-center text-[#240303] dark:text-[#E5B869] shrink-0">
          <UserPlus className="size-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            একাউন্ট তৈরি করুন (ঐচ্ছিক)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ভবিষ্যতে এক ক্লিকে অর্ডার করতে ও স্ট্যাটাস দেখতে পাসওয়ার্ড সেট করুন।
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            ইমেইল
          </Label>
          <Input
            {...register("email")}
            type="email"
            placeholder="আপনার ইমেইল দিন"
            className="h-10 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm focus-visible:ring-[#240303]"
          />
          {errors.email && (
            <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            নতুন পাসওয়ার্ড
          </Label>
          <Input
            {...register("password")}
            type="password"
            placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
            className="h-10 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm focus-visible:ring-[#240303]"
          />
          {errors.password && (
            <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
          )}
        </div>
        
        <Button
          disabled={isSubmitting}
          type="submit"
          className="w-full h-10 rounded-lg text-sm font-bold bg-[#240303] hover:bg-[#3a0808] text-white shadow-xs transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin size-4" />
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>একাউন্ট তৈরি করে লিংক করুন</span>
              <ArrowRight className="size-4" />
            </div>
          )}
        </Button>
      </form>
    </div>
  );
}
