// src/components/order/TrackOrderForm.tsx
"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  Hash,
  HelpCircle,
  Phone,
  Calendar,
  User,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/priceUtils";
import { toast } from "sonner";
import type { IOrder } from "@/types/order";

const STAGES = [
  { id: "pending", label: "অর্ডার গ্রহণ", en: "Order Placed", icon: Clock },
  { id: "confirmed", label: "নিশ্চিত হয়েছে", en: "Confirmed", icon: CheckCircle2 },
  { id: "processing", label: "প্রসেসিং হচ্ছে", en: "Processing", icon: Package },
  { id: "shipped", label: "অন দ্য ওয়ে", en: "On the Way", icon: Truck },
  { id: "delivered", label: "ডেলিভার্ড", en: "Delivered", icon: MapPin },
];

type TrackedOrder = Pick<
  IOrder,
  | "orderNumber"
  | "channelSource"
  | "orderStatus"
  | "paymentMethod"
  | "paymentStatus"
  | "total"
  | "items"
  | "subtotal"
  | "shippingCost"
  | "discount"
  | "couponCode"
  | "createdAt"
  | "shipping"
>;

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("orderId") || searchParams.get("order") || "";

  const [orderId, setOrderId] = useState<string>(initialOrderId);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const fetchTrackStatus = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      toast.error("আপনার Order ID বা ফোন নম্বর দিন");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/order/track?orderId=${encodeURIComponent(searchQuery.trim())}`,
      );
      const data = (await res.json()) as {
        success: boolean;
        order?: TrackedOrder;
        error?: string;
      };

      if (data.success && data.order) {
        setOrder(data.order);
        setTimeout(() => {
          const element = resultRef.current;
          if (element) {
            const elementRect = element.getBoundingClientRect();
            const headerOffset = 80;
            const scrollTarget = elementRect.top + window.scrollY - headerOffset;
            window.scrollTo({
              top: scrollTarget,
              behavior: "smooth",
            });
          }
        }, 120);
      } else {
        toast.error(data.error ?? "Order খুঁজে পাওয়া যায়নি");
        setOrder(null);
      }
    } catch {
      toast.error("কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      fetchTrackStatus(initialOrderId);
    }
  }, [initialOrderId]);

  const handleTrack = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchTrackStatus(orderId);
  };

  const getStatusIndex = (status: string): number => {
    return STAGES.findIndex((s) => s.id === status);
  };

  const isCancelled = order?.orderStatus === "cancelled";
  const isReturned =
    order?.orderStatus === "returned" || order?.orderStatus === "in_return";

  return (
    <div className="space-y-8 max-w-4xl mx-auto" suppressHydrationWarning>
      {/* Search Section - Clean Minimal Card */}
      <form
        onSubmit={handleTrack}
        className="max-w-xl mx-auto bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#240303]/5 dark:bg-amber-500/10 border border-[#240303]/10 dark:border-amber-500/20 text-[#240303] dark:text-amber-400 text-xs font-semibold">
            <Sparkles className="size-3.5 text-[#C59B27]" />
            স্মার্ট অর্ডার ট্র্যাকিং
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            অর্ডার ট্র্যাক করুন
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
            অর্ডার আইডি বা ব্যবহৃত মোবাইল নম্বর দিয়ে লাইভ স্ট্যাটাস দেখুন
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Hash className="size-3.5 text-[#240303] dark:text-amber-400" />
              Order ID বা ফোন নম্বর
            </label>
            <div className="relative">
              <Input
                placeholder="যেমন: GH-WEB-260915-0003 বা 017XXXXXXXX"
                className="h-12 rounded-lg bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus-visible:ring-1 focus-visible:ring-[#240303] focus-visible:border-[#240303] transition-all px-4 pr-10"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
              <Search className="size-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Quick UX Hint Box */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-xs font-semibold">
              <HelpCircle className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>সহজে খোঁজার টিপস:</span>
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pl-5 list-disc leading-relaxed">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">ফুল আইডি:</strong>{" "}
                <code className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[#240303] dark:text-amber-400 font-mono text-[11px]">
                  GH-WEB-260915-0003
                </code>
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">সংক্ষিপ্ত নম্বর:</strong>{" "}
                <code className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                  260915-0003
                </code>
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">মোবাইল নম্বর:</strong> অর্ডারে ব্যবহৃত আপনার{" "}
                <span className="font-semibold text-slate-900 dark:text-white">১১ ডিজিটের ফোন নম্বর</span>
              </li>
            </ul>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-lg font-semibold text-sm bg-[#240303] hover:bg-[#3b0808] text-white transition-all shadow-xs active:scale-[0.99]"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Clock className="size-4 animate-spin" /> খুঁজছি...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Search className="size-4" /> স্ট্যাটাস দেখুন
            </span>
          )}
        </Button>
      </form>

      {/* Result Section - Clean, Minimal, Premium Ant Design Style */}
      {order && (
        <div
          ref={resultRef}
          className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          {/* Main Progress Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Card Header */}
            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      বর্তমান অগ্রগতি
                    </span>
                    {isCancelled ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                        <XCircle className="size-3" /> বাতিল করা হয়েছে
                      </span>
                    ) : isReturned ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                        <AlertCircle className="size-3" /> রিটার্ন করা হয়েছে
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        চলমান
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                    Order {order.orderNumber}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium flex-wrap pt-0.5">
                    <span className="flex items-center gap-1.5">
                      <User className="size-3.5 text-slate-400" />
                      {order.shipping?.name || "গ্রাহক"}
                    </span>
                    {order.createdAt && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-slate-400" />
                        {new Date(order.createdAt).toLocaleDateString("bn-BD", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right space-y-1 sm:self-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/60 dark:border-slate-800">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    মোট পরিমাণ
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-[#240303] dark:text-amber-400">
                    {formatPrice(order.total)}
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <span>পদ্ধতি:</span>
                    <strong className="text-slate-900 dark:text-white">{order.paymentMethod?.toUpperCase()}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Stepper Timeline */}
            {!isCancelled && !isReturned ? (
              <div className="p-6 sm:p-8">
                {/* Desktop Stepper */}
                <div className="relative hidden md:block">
                  {/* Background Track Line */}
                  <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-200 dark:bg-slate-800" />

                  {/* Active Track Line */}
                  {(() => {
                    const currentIdx = getStatusIndex(order.orderStatus);
                    const safeIdx = currentIdx >= 0 ? currentIdx : 0;
                    const progressPercent = (safeIdx / (STAGES.length - 1)) * 100;
                    return (
                      <div
                        className="absolute top-5 left-10 h-0.5 bg-[#240303] dark:bg-amber-500 transition-all duration-500"
                        style={{ width: `calc(${progressPercent}% - 20px)` }}
                      />
                    );
                  })()}

                  {/* Stage Nodes */}
                  <div className="grid grid-cols-5 gap-4 relative z-10">
                    {STAGES.map((stage, idx) => {
                      const activeIndex = getStatusIndex(order.orderStatus);
                      const isPast = activeIndex > idx;
                      const isCurrent = order.orderStatus === stage.id;
                      const isCompleteOrCurrent = activeIndex >= idx;

                      return (
                        <div
                          key={stage.id}
                          className="flex flex-col items-center text-center group space-y-2.5"
                        >
                          <div
                            className={cn(
                              "size-10 rounded-full flex items-center justify-center transition-all duration-300 ring-4 ring-white dark:ring-slate-900",
                              isCompleteOrCurrent
                                ? "bg-[#240303] text-white shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400",
                              isCurrent && "ring-[#240303]/20 dark:ring-amber-400/20 scale-105",
                            )}
                          >
                            {isPast ? (
                              <CheckCircle2 className="size-5" />
                            ) : (
                              <stage.icon
                                className={cn("size-4.5", isCurrent && "animate-pulse")}
                              />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p
                              className={cn(
                                "text-xs font-semibold transition-colors",
                                isCompleteOrCurrent
                                  ? "text-slate-900 dark:text-white"
                                  : "text-slate-400 dark:text-slate-500",
                              )}
                            >
                              {stage.label}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                              {stage.en}
                            </p>
                            {isCurrent && (
                              <span className="inline-block mt-1 text-[10px] font-semibold bg-[#240303]/10 dark:bg-amber-500/10 text-[#240303] dark:text-amber-400 border border-[#240303]/20 dark:border-amber-500/30 px-2 py-0.5 rounded-full">
                                বর্তমান ধাপ
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Stepper - Clean Vertical Timeline */}
                <div className="md:hidden space-y-6 relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 ml-4">
                  {STAGES.map((stage, idx) => {
                    const activeIndex = getStatusIndex(order.orderStatus);
                    const isPast = activeIndex > idx;
                    const isCurrent = order.orderStatus === stage.id;
                    const isCompleteOrCurrent = activeIndex >= idx;

                    return (
                      <div key={stage.id} className="relative group">
                        {/* Node icon attached to border */}
                        <div
                          className={cn(
                            "absolute -left-[35px] top-0 size-7 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 text-xs transition-all",
                            isCompleteOrCurrent
                              ? "bg-[#240303] text-white shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400",
                            isCurrent && "ring-[#240303]/20 dark:ring-amber-400/20 scale-110",
                          )}
                        >
                          {isPast ? (
                            <CheckCircle2 className="size-3.5" />
                          ) : (
                            <stage.icon className="size-3.5" />
                          )}
                        </div>

                        <div className="pl-2">
                          <div className="flex items-center gap-2">
                            <p
                              className={cn(
                                "text-sm font-semibold",
                                isCompleteOrCurrent
                                  ? "text-slate-900 dark:text-white"
                                  : "text-slate-400 dark:text-slate-500",
                              )}
                            >
                              {stage.label}
                            </p>
                            <span className="text-xs text-slate-400">({stage.en})</span>
                            {isCurrent && (
                              <span className="text-[10px] font-semibold bg-[#240303]/10 dark:bg-amber-500/10 text-[#240303] dark:text-amber-400 border border-[#240303]/20 dark:border-amber-500/30 px-2 py-0.2 rounded-full">
                                বর্তমান
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center space-y-2">
                <AlertCircle className="size-8 text-rose-500 mx-auto" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {isCancelled ? "এই অর্ডারটি বাতিল করা হয়েছে" : "এই অর্ডারটি রিটার্ন করা হয়েছে"}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  বিস্তারিত জানতে আমাদের সাপোর্ট সেন্টারে যোগাযোগ করুন।
                </p>
              </div>
            )}

            {/* Order Items Preview (if available) */}
            {order.items && order.items.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800 p-6 sm:p-8 bg-slate-50/30 dark:bg-slate-900/30">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <ShoppingBag className="size-3.5 text-[#240303] dark:text-amber-400" />
                    অর্ডার আইটেমস ({order.items.length})
                  </h4>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="py-3 flex items-center justify-between gap-4 text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.productImage ? (
                          <div className="relative size-12 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 bg-white">
                            <Image
                              src={item.productImage}
                              alt={item.productTitle}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="size-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <Package className="size-5 text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">
                            {item.productTitle}
                          </p>
                          <p className="text-xs text-slate-500">
                            পরিমাণ: {item.itemQuantity}টি
                            {item.size ? ` • সাইজ: ${item.size}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {formatPrice(item.unitPrice * item.itemQuantity)}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          @{formatPrice(item.unitPrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sub Details Grid (Shipping & Support) */}
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Delivery Address Card */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <MapPin className="size-4 text-[#240303] dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    ডেলিভারি ঠিকানা
                  </h4>
                  <p className="text-xs font-medium text-slate-900 dark:text-white">
                    {order.shipping?.name} • {order.shipping?.phone}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-lg border border-slate-200/70 dark:border-slate-800 text-xs space-y-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                <p className="font-medium text-slate-900 dark:text-white">
                  {[
                    order.shipping?.addressLine1,
                    order.shipping?.addressLine2,
                    order.shipping?.city,
                    order.shipping?.district,
                  ]
                    .filter(
                      (p): p is string =>
                        Boolean(p) && !/outside dhaka|inside dhaka|^dhaka$/i.test(p!.trim()),
                    )
                    .join(", ") || order.shipping?.addressLine1}
                </p>
                <div className="pt-1 flex items-center gap-2 text-[11px]">
                  <span className="text-slate-400">ডেলিভারি জোন:</span>
                  <span className="font-semibold text-[#240303] dark:text-amber-400">
                    {order.shipping?.deliveryZone ||
                      (order.shippingCost > 80 ? "OSD (ঢাকার বাইরে)" : "ISD (ঢাকার ভেতরে)")}
                  </span>
                </div>
              </div>
            </div>

            {/* Help & Support Card */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <Phone className="size-4 text-[#240303] dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      সহায়তা প্রয়োজন?
                    </h4>
                    <p className="text-xs font-medium text-slate-900 dark:text-white">
                      ২৪/৭ কাস্টমার সাপোর্ট টিম
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  অর্ডার সংক্রান্ত যে কোনো তথ্য বা ডেলিভারি পরিবর্তন করতে আমাদের হেল্পলাইনে সরাসরি যোগাযোগ করুন।
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center w-full gap-1.5 h-10 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
                >
                  যোগাযোগ পৃষ্ঠায় যান <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TrackOrderForm() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto p-12 text-center text-slate-400">লোড হচ্ছে...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}

