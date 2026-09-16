// src/app/(main)/checkout/CheckoutForm.tsx
"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { createOrder } from "@/actions/order";
import {
  calculateShippingCost,
  getWeightTierLabel,
  DeliveryZone,
} from "@/lib/shipping";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Loader2,
  Banknote,
  ShieldCheck,
  Truck,
  ArrowRight,
  Check,
  User,
  CreditCard,
  Zap,
  Package,
  RotateCcw,
  Copy,
  Info,
} from "lucide-react";
import { formatPrice } from "@/lib/priceUtils";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { IPopulatedCartItem } from "@/types/cart";
import Link from "next/link";

const CheckoutSchema = z
  .object({
    name: z.string().min(3, "নাম কমপক্ষে ৩ অক্ষর হওয়া উচিত"),
    phone: z.string().regex(/^01[3-9]\d{8}$/, "সঠিক ফোন নম্বর দিন"),
    isGift: z.boolean().optional(),
    receiverName: z.string().optional(),
    receiverPhone: z.string().optional(),
    addressLine1: z.string().min(5, "বিস্তারিত ঠিকানা দিন"),
    deliveryArea: z.enum(["dhaka", "suburbs", "outside"] as const),
    paymentMethod: z.enum(["cod", "mobile"] as const),
    paymentProvider: z.enum(["bkash", "nagad", "rocket"] as const).optional(),
    senderNumber: z.string().optional(),
    transactionId: z.string().optional(),
    customerNotes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.paymentMethod === "mobile") {
        return (
          !!data.paymentProvider && !!data.senderNumber && !!data.transactionId
        );
      }
      return true;
    },
    {
      message: "মোবাইল পেমেন্টের জন্য সব তথ্য দিন",
      path: ["transactionId"],
    },
  );

type CheckoutValues = z.infer<typeof CheckoutSchema>;

interface CheckoutFormProps {
  cart: {
    items: IPopulatedCartItem[];
    total: number;
  };
  user?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

const PAYMENT_ACCOUNTS = {
  bkash: {
    name: "bKash",
    number: "01742413416",
    logo: "/payment-method-logo/bkash.svg",
    color: "text-[#D12053]",
  },
  nagad: {
    name: "Nagad",
    number: "01742413416",
    logo: "/payment-method-logo/nagad.svg",
    color: "text-[#EF4136]",
  },
  rocket: {
    name: "Rocket",
    number: "01742413416",
    logo: "/payment-method-logo/rocket.png",
    color: "text-[#8C3494]",
  },
} as const;

export function CheckoutForm({ cart, user }: CheckoutFormProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(CheckoutSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      isGift: false,
      receiverName: "",
      receiverPhone: "",
      deliveryArea: "dhaka",
      paymentMethod: "cod",
      paymentProvider: "bkash",
    },
  });

  // ডাটা রিস্টোর করো
  useEffect(() => {
    const savedData = sessionStorage.getItem("checkout_form_data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        Object.keys(parsed).forEach((key) => {
          setValue(key as keyof CheckoutValues, parsed[key]);
        });
      } catch (e) {
        console.error("Failed to restore checkout data", e);
      }
    }
  }, [setValue]);

  const deliveryArea = useWatch({ control, name: "deliveryArea" }) || "dhaka";
  const paymentMethod = useWatch({ control, name: "paymentMethod" });
  const paymentProvider =
    useWatch({ control, name: "paymentProvider" }) || "bkash";
  const isGift = useWatch({ control, name: "isGift" });

  const totalWeightGrams = cart.items.reduce((sum, item) => {
    const itemWeight = (item.product as unknown as { weight?: number })?.weight || 0;
    return sum + itemWeight * item.itemQuantity;
  }, 0);

  const deliveryCharge = calculateShippingCost(
    deliveryArea as DeliveryZone,
    totalWeightGrams,
  );
  const grandTotal = cart.total + deliveryCharge;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("নাম্বার কপি করা হয়েছে!");
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = async (values: CheckoutValues) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("phone", values.phone);
      formData.append("addressLine1", values.addressLine1);
      formData.append("deliveryArea", values.deliveryArea);
      formData.append("paymentMethod", values.paymentMethod);
      if (values.paymentProvider) formData.append("paymentProvider", values.paymentProvider);
      if (values.senderNumber) formData.append("senderNumber", values.senderNumber);
      if (values.transactionId) formData.append("transactionId", values.transactionId);
      if (values.customerNotes) formData.append("customerNotes", values.customerNotes);
      formData.append("isGift", values.isGift ? "true" : "false");
      if (values.receiverName) formData.append("receiverName", values.receiverName);
      if (values.receiverPhone) formData.append("receiverPhone", values.receiverPhone);

      const result = await createOrder(formData);

      if (result && "orderNumber" in result && result.orderNumber) {
        sessionStorage.removeItem("checkout_form_data");
        queryClient.invalidateQueries({ queryKey: ["cart-details"] });
        router.push(`/checkout/success?order=${result.orderNumber}`);
      } else if (result && "error" in result && result.error) {
        toast.error(
          typeof result.error === "string"
            ? result.error
            : "কিছু ভুল হয়েছে, দয়া করে আবার চেষ্টা করুন।",
        );
      }
    } catch {
      toast.error("কিছু ভুল হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* ── Quick Google Sign-In Banner (Ant Design Alert Style) ── */}
      {!session && (
        <div className="p-3.5 sm:p-4 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <Info className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                অর্ডার প্রক্রিয়া আরও দ্রুত করতে চান?
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Google দিয়ে লগইন করলে আপনার নাম ও তথ্যগুলো স্বয়ংক্রিয়ভাবে পূরণ হয়ে যাবে।
              </p>
            </div>
          </div>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent("/checkout")}`}
            className="shrink-0"
          >
            <Button
              type="button"
              variant="outline"
              className="h-8 px-3.5 rounded-lg text-xs font-semibold border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/50 shadow-2xs cursor-pointer"
            >
              <User className="size-3.5 mr-1.5" />
              Google দিয়ে লগইন করুন
            </Button>
          </Link>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start min-w-0"
      >
        {/* ── Left Side: Form Information (Ant Design Cards) ── */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4 min-w-0">
          {/* Section 1: Contact Information Card */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xs space-y-4 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <User className="size-4 text-[#240303] dark:text-[#E5B869]" />
              কন্টাক্ট ইনফরমেশন
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  নাম <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("name")}
                  placeholder="আপনার পুরো নাম"
                  className="h-10 rounded-lg text-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-[#240303] focus:ring-0 focus-visible:ring-0 focus:outline-none"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 font-medium mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  মোবাইল নম্বর <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("phone")}
                  placeholder="01XXXXXXXXX"
                  className="h-10 rounded-lg text-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-[#240303] focus:ring-0 focus-visible:ring-0 focus:outline-none"
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 font-medium mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Gift Option Checkbox */}
              <div className="sm:col-span-2">
                <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register("isGift")}
                    className="size-4 mt-0.5 rounded border-slate-300 text-[#240303] focus:ring-[#240303]"
                  />
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      পার্সেলটি অন্য কেউ রিসিভ করবেন? (উপহার বা বিকল্প গ্রাহক)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      ডেলিভারি রিসিভারের নাম ও ফোন নম্বর আলাদা দিতে এখানে টিক দিন
                    </p>
                  </div>
                </label>
              </div>

              {isGift && (
                <>
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      রিসিভারের নাম
                    </Label>
                    <Input
                      {...register("receiverName")}
                      placeholder="যিনি পার্সেল রিসিভ করবেন"
                      className="h-10 rounded-lg text-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-[#240303] focus:ring-0 focus-visible:ring-0 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      রিসিভারের মোবাইল নম্বর
                    </Label>
                    <Input
                      {...register("receiverPhone")}
                      placeholder="ডেলিভারিম্যান এই নম্বরে কল করবে"
                      className="h-10 rounded-lg text-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-[#240303] focus:ring-0 focus-visible:ring-0 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* Detailed Address */}
              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    বিস্তারিত ডেলিভারি ঠিকানা <span className="text-red-500">*</span>
                  </Label>
                  <span className="text-[11px] text-slate-400">
                    (বাড়ি নং, রোড, এলাকা/গ্রাম, থানা, জেলা)
                  </span>
                </div>
                <Textarea
                  {...register("addressLine1")}
                  placeholder="আপনার পূর্ণাঙ্গ ঠিকানা লিখুন..."
                  className="min-h-20 rounded-lg text-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 p-3 leading-relaxed resize-none focus:border-[#240303] focus:ring-0 focus-visible:ring-0 focus:outline-none"
                />
                {errors.addressLine1 && (
                  <p className="text-xs text-red-500 font-medium mt-1">
                    {errors.addressLine1.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Area Card */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xs space-y-3 min-w-0">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="size-4 text-[#240303] dark:text-[#E5B869]" />
                ডেলিভারি এরিয়া
              </h2>
              <div className="bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                ওজন: {totalWeightGrams}g ({getWeightTierLabel(totalWeightGrams)})
              </div>
            </div>

            <RadioGroup
              onValueChange={(v: DeliveryZone) => setValue("deliveryArea", v)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3"
            >
              {[
                {
                  id: "dhaka" as const,
                  label: "ঢাকার ভেতর (ISD)",
                  sub: "ঢাকা সিটির অভ্যন্তরীণ সকল এলাকা",
                  price: calculateShippingCost("dhaka", totalWeightGrams),
                },
                {
                  id: "suburbs" as const,
                  label: "উপ-শহর (SUB)",
                  sub: "গাজীপুর, সাভার, নারায়নগঞ্জ, কেরানীগঞ্জ",
                  price: calculateShippingCost("suburbs", totalWeightGrams),
                },
                {
                  id: "outside" as const,
                  label: "ঢাকার বাইরে (OSD)",
                  sub: "সারা বাংলাদেশের সকল জেলা/উপজেলা",
                  price: calculateShippingCost("outside", totalWeightGrams),
                },
              ].map((area) => (
                <div
                  key={area.id}
                  onClick={() => setValue("deliveryArea", area.id)}
                  className={cn(
                    "relative flex flex-col justify-between p-3.5 rounded-lg border transition-all cursor-pointer min-w-0 overflow-hidden",
                    deliveryArea === area.id
                      ? "border-[#240303] bg-[#fdf6f0] dark:bg-slate-800/80 shadow-2xs"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300"
                  )}
                >
                  {deliveryArea === area.id && (
                    <div className="absolute top-0 right-0 bg-[#240303] text-white w-[26px] h-[22px] flex items-center justify-center rounded-bl-xl shadow-2xs z-10 animate-in fade-in duration-150">
                      <Check className="size-3.5 stroke-[3px] text-white" />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pr-5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          "size-4 rounded-full border flex items-center justify-center transition-all shrink-0",
                          deliveryArea === area.id
                            ? "border-[#240303]"
                            : "border-slate-300 dark:border-slate-600"
                        )}
                      >
                        {deliveryArea === area.id && (
                          <div className="size-2 rounded-full bg-[#240303]" />
                        )}
                      </div>
                      <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                        {area.label}
                      </p>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-[#240303] dark:text-[#E5B869] shrink-0">
                      ৳{area.price}
                    </span>
                  </div>

                  <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                    {area.sub}
                  </p>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Section 3: Payment Method Card */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xs space-y-3 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <CreditCard className="size-4 text-[#240303] dark:text-[#E5B869]" />
              পেমেন্ট মেথড
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Cash On Delivery */}
              <div
                onClick={() => setValue("paymentMethod", "cod")}
                className={cn(
                  "relative flex items-center gap-3 p-3.5 rounded-lg border transition-all cursor-pointer min-w-0 overflow-hidden",
                  paymentMethod === "cod"
                    ? "border-[#240303] bg-[#fdf6f0] dark:bg-slate-800/80 shadow-2xs"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300"
                )}
              >
                {paymentMethod === "cod" && (
                  <div className="absolute top-0 right-0 bg-[#240303] text-white w-[26px] h-[22px] flex items-center justify-center rounded-bl-xl shadow-2xs z-10 animate-in fade-in duration-150">
                    <Check className="size-3.5 stroke-[3px] text-white" />
                  </div>
                )}

                <div
                  className={cn(
                    "size-4 rounded-full border flex items-center justify-center transition-all shrink-0",
                    paymentMethod === "cod"
                      ? "border-[#240303]"
                      : "border-slate-300 dark:border-slate-600"
                  )}
                >
                  {paymentMethod === "cod" && (
                    <div className="size-2 rounded-full bg-[#240303]" />
                  )}
                </div>
                <Banknote className="size-5 text-[#240303] dark:text-[#E5B869] shrink-0" />
                <div className="min-w-0 pr-4">
                  <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-tight">
                    ক্যাশ অন ডেলিভারি
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    পণ্য চেক করে হাতে পেয়ে টাকা দিন
                  </p>
                </div>
              </div>

              {/* Mobile Banking */}
              <div
                onClick={() => setValue("paymentMethod", "mobile")}
                className={cn(
                  "relative flex items-center gap-3 p-3.5 rounded-lg border transition-all cursor-pointer min-w-0 overflow-hidden",
                  paymentMethod === "mobile"
                    ? "border-[#240303] bg-[#fdf6f0] dark:bg-slate-800/80 shadow-2xs"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300"
                )}
              >
                {paymentMethod === "mobile" && (
                  <div className="absolute top-0 right-0 bg-[#240303] text-white w-[26px] h-[22px] flex items-center justify-center rounded-bl-xl shadow-2xs z-10 animate-in fade-in duration-150">
                    <Check className="size-3.5 stroke-[3px] text-white" />
                  </div>
                )}

                <div
                  className={cn(
                    "size-4 rounded-full border flex items-center justify-center transition-all shrink-0",
                    paymentMethod === "mobile"
                      ? "border-[#240303]"
                      : "border-slate-300 dark:border-slate-600"
                  )}
                >
                  {paymentMethod === "mobile" && (
                    <div className="size-2 rounded-full bg-[#240303]" />
                  )}
                </div>
                <Zap className="size-5 text-amber-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-tight">
                    মোবাইল ব্যাংকিং
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    বিকাশ, নগদ বা রকেট
                  </p>
                </div>
                <div className="flex -space-x-1.5 shrink-0 pr-4">
                  {(["bkash", "nagad", "rocket"] as const).map((p) => (
                    <div
                      key={p}
                      className="relative size-6 rounded-full bg-white shadow-2xs border border-slate-200 overflow-hidden flex items-center justify-center"
                    >
                      <Image
                        src={`/payment-method-logo/${p}.${p === "rocket" ? "png" : "svg"}`}
                        alt={p}
                        fill
                        className="object-contain p-0.5"
                        sizes="24px"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Banking Sub-panel */}
            {paymentMethod === "mobile" && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-3 gap-2.5">
                  {(["bkash", "nagad", "rocket"] as const).map((p) => (
                    <div
                      key={p}
                      onClick={() => setValue("paymentProvider", p)}
                      className={cn(
                        "relative flex flex-col items-center p-3 rounded-lg border transition-all cursor-pointer bg-white dark:bg-slate-800 text-center overflow-hidden",
                        paymentProvider === p
                          ? "border-[#240303] shadow-2xs bg-[#fdf6f0] dark:bg-slate-800"
                          : "border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100"
                      )}
                    >
                      {paymentProvider === p && (
                        <div className="absolute top-0 right-0 bg-[#240303] text-white w-[22px] h-[18px] flex items-center justify-center rounded-bl-lg shadow-2xs z-10 animate-in fade-in duration-150">
                          <Check className="size-3 stroke-[3px] text-white" />
                        </div>
                      )}
                      <div className="relative size-8 mb-1">
                        <Image
                          src={PAYMENT_ACCOUNTS[p].logo}
                          alt={p}
                          fill
                          sizes="32px"
                          className="object-contain"
                        />
                      </div>
                      <span className="text-[11px] font-bold capitalize text-slate-800 dark:text-slate-200">
                        {p}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Send Money (Personal)
                    </p>
                    <p className="text-base sm:text-lg font-mono font-black text-slate-800 dark:text-slate-100 truncate">
                      {PAYMENT_ACCOUNTS[paymentProvider]?.number}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(PAYMENT_ACCOUNTS[paymentProvider].number)}
                    className="h-8 px-3 rounded-md text-xs font-bold shrink-0 border-slate-300 dark:border-slate-600 hover:border-[#240303] cursor-pointer"
                  >
                    <Copy className="size-3 mr-1" />
                    {copied ? "কপি হয়েছে" : "কপি"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      আপনার প্রেরক নম্বর <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("senderNumber")}
                      placeholder="01XXXXXXXXX"
                      className="h-9 rounded-md text-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-[#240303] focus:ring-0 focus-visible:ring-0 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Transaction ID (TrxID) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("transactionId")}
                      placeholder="e.g. 9J8X72W..."
                      className="h-9 rounded-md text-sm uppercase bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-[#240303] focus:ring-0 focus-visible:ring-0 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Customer Notes (Optional) */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs space-y-2 min-w-0">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              অতিরিক্ত নোট বা নির্দেশনা (ঐচ্ছিক)
            </Label>
            <Textarea
              {...register("customerNotes")}
              placeholder="ডেলিভারি বা সময় সম্পর্কে বিশেষ কোনো নির্দেশনা থাকলে এখানে লিখুন..."
              className="min-h-16 rounded-lg text-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 resize-none p-2.5 leading-relaxed focus:border-[#240303] focus:ring-0 focus-visible:ring-0 focus:outline-none"
            />
          </div>
        </div>

        {/* ── Right Side: Order Summary Card (Ant Design Architecture) ── */}
        <div className="lg:col-span-5 xl:col-span-4 min-w-0">
          <div className="lg:sticky lg:top-20 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4 min-w-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                অর্ডার সামারি
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {cart.items.length}টি আইটেম
              </span>
            </div>

            {/* Cart items list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar border-b border-slate-100 dark:border-slate-800 pb-3 min-w-0">
              {cart.items.map((item) => (
                <div
                  key={`${item.product._id}-${item.color || ""}-${item.size || ""}`}
                  className="flex items-start gap-3 min-w-0"
                >
                  <div className="relative size-12 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 aspect-square bg-slate-50">
                    <Image
                      src={item.product.thumbnail}
                      alt={item.product.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                    <span className="absolute top-0 right-0 bg-[#240303] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl">
                      ×{item.itemQuantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-snug">
                      {item.product.title}
                    </h4>
                    {(item.color || item.size) && (
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {[item.color && `কালার: ${item.color}`, item.size && `সাইজ: ${item.size}`].filter(Boolean).join(" | ")}
                      </p>
                    )}
                    <p className="text-xs font-semibold text-[#240303] dark:text-[#E5B869] mt-0.5">
                      {formatPrice(item.product.salePrice || item.product.regularPrice)}
                    </p>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white shrink-0">
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>

            {/* Calculation details */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>সাবটোটাল</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatPrice(cart.total)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>ডেলিভারি চার্জ</span>
                <span className="font-bold text-[#240303] dark:text-[#E5B869]">
                  + {formatPrice(deliveryCharge)}
                </span>
              </div>
            </div>

            {/* Grand Total Row */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline mb-2 min-w-0">
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                  সর্বমোট
                </span>
                <span className="text-[10px] text-slate-400">
                  (ডেলিভারি চার্জ সহ)
                </span>
              </div>
              <span className="text-2xl font-black text-[#240303] dark:text-[#f87171] shrink-0">
                {formatPrice(grandTotal)}
              </span>
            </div>

            {/* Primary Submit Button (Deep Brownish Maroon Gradient) */}
            <Button
              disabled={isSubmitting}
              type="submit"
              className="w-full h-12 rounded-lg text-sm sm:text-base font-bold bg-gradient-to-r from-[#1A0101] via-[#240303] to-[#1E0202] hover:from-[#240303] hover:to-[#2D0505] text-white border-none shadow-xs active:scale-[0.98] transition-all cursor-pointer group"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin size-5" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>অর্ডার কনফার্ম করুন</span>
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>

            {/* Trust Assurances Icons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50/60 dark:bg-slate-800/40">
                <ShieldCheck className="size-4 text-[#240303] dark:text-[#E5B869]" />
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">১০০% খাঁটি পণ্য</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50/60 dark:bg-slate-800/40">
                <Package className="size-4 text-emerald-600" />
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">ক্যাশ অন ডেলিভারি</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50/60 dark:bg-slate-800/40">
                <RotateCcw className="size-4 text-amber-600" />
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">৭ দিনের রিটার্ন</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}