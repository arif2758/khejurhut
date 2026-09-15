// src/components/order/TrackOrderForm.tsx
"use client";
import { useState, useRef } from "react";
import {
  Search,
  ChevronRight,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  Phone,
  Hash,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/priceUtils";
import { toast } from "sonner";
import type { IOrder } from "@/types/order";

const STAGES = [
  { id: "pending", label: "Order Placed", icon: Clock },
  { id: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { id: "processing", label: "Processing", icon: Package },
  { id: "shipped", label: "On the Way", icon: Truck },
  { id: "delivered", label: "Delivered", icon: MapPin },
];

type TrackedOrder = Pick<
  IOrder,
  | "orderNumber"
  | "channelSource"
  | "orderStatus"
  | "paymentMethod"
  | "total"
  | "items"
  | "subtotal"
  | "shippingCost"
  | "discount"
  | "couponCode"
  | "createdAt"
  | "shipping"
>;

export function TrackOrderForm() {
  const [orderId, setOrderId] = useState<string>("");
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
            const headerOffset = 40;
            const viewportCenter = window.innerHeight / 2;
            const scrollTarget =
              elementRect.top + window.scrollY - headerOffset - viewportCenter / 2;

            window.scrollTo({
              top: scrollTarget,
              behavior: "smooth",
            });
          }
        }, 100);
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

  const handleTrack = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchTrackStatus(orderId);
  };

  const getStatusIndex = (status: string): number => {
    return STAGES.findIndex((s) => s.id === status);
  };

  return (
    <div className="space-y-12" suppressHydrationWarning>
      {/* Search Section */}
      <form
        onSubmit={handleTrack}
        className="max-w-xl mx-auto space-y-6 bg-white/90 dark:bg-[#1A0505]/70 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-[#2F0C0B]/12 shadow-[0_8px_32px_rgba(42,1,1,0.08)]"
      >
        <div className="space-y-2 text-center mb-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1A0101]/10 border border-[#C59B27]/30 text-[#1A0101] dark:text-[#E5B869] text-[11px] font-black uppercase tracking-widest">
            <Sparkles className="size-3.5 text-[#C59B27]" /> স্মার্ট অর্ডার ট্র্যাকিং
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#120000] dark:text-foreground tracking-tight">
            আপনার শিপমেন্ট ট্র্যাক করুন
          </h2>
          <p className="text-xs text-[#5C4D4A] dark:text-muted-foreground font-medium">
            অর্ডার আইডি বা মোবাইল নম্বর যেকোনো স্টাইলে ইনপুট দিয়ে লাইভ স্ট্যাটাস দেখুন
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-[#5C4D4A] dark:text-muted-foreground tracking-widest ml-1 flex items-center gap-1.5">
              <Hash className="size-3.5 text-[#1A0101] dark:text-[#E5B869]" /> Order ID বা ফোন নম্বর
            </label>
            <Input
              placeholder="যেমন: KH-260731-0005 বা 017XXXXXXXX"
              className="h-14 rounded-2xl bg-[#FAF7F2]/70 dark:bg-black/20 border-2 border-[#2F0C0B]/15 text-[#120000] dark:text-foreground font-bold text-base sm:text-lg focus-visible:ring-[#C59B27]/30 focus-visible:border-[#C59B27] transition-all px-5"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
          </div>

          {/* Super UX Helper Box */}
          <div className="bg-[#FAF7F2]/60 dark:bg-black/20 p-4 rounded-2xl border border-[#2F0C0B]/10 space-y-2">
            <div className="flex items-center gap-2 text-[#120000] dark:text-foreground text-xs font-black">
              <HelpCircle className="size-4 text-[#C59B27] shrink-0" />
              <span>সার্চ করার ৩টি সহজ উপায়:</span>
            </div>
            <ul className="text-[11px] font-medium text-[#5C4D4A] dark:text-muted-foreground space-y-1.5 pl-6 list-disc">
              <li>
                <strong className="text-[#120000] dark:text-foreground">ইনভয়েস ID দিয়ে:</strong> যেমন{" "}
                <code className="bg-white/80 dark:bg-[#1A0505] px-1.5 py-0.5 rounded border border-[#2F0C0B]/15 text-[#1A0101] dark:text-[#E5B869] font-bold">
                  KH-260731-0005
                </code>
              </li>
              <li>
                <strong className="text-[#120000] dark:text-foreground">সংক্ষিপ্ত নম্বর দিয়ে:</strong> ড্যাশ, স্পেস বা স্মল লেটারেও লিখতে পারেন (যেমন:{" "}
                <code className="bg-white/80 dark:bg-[#1A0505] px-1.5 py-0.5 rounded border border-[#2F0C0B]/15 text-[#120000] dark:text-foreground font-bold">
                  260731-0005
                </code>
                )
              </li>
              <li>
                <strong className="text-[#120000] dark:text-foreground">ফোন নম্বর দিয়ে:</strong> অর্ডার করার সময় ব্যবহৃত আপনার{" "}
                <strong className="text-[#1A0101] dark:text-[#E5B869]">১১ ডিজিটের মোবাইল নম্বর</strong> দিলেই চলবে।
              </li>
            </ul>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs gap-3 bg-gradient-to-r from-[#1A0101] via-[#240303] to-[#1E0202] text-[#FAF6F0] hover:from-[#240303] hover:to-[#2D0505] shadow-xl shadow-[#1A0101]/25 hover:shadow-[#1A0101]/35 border border-[#C59B27]/30 transition-all active:scale-95"
        >
          {loading ? (
            "খুঁজছি..."
          ) : (
            <>
              <Search className="size-4 text-[#D4A373]" />
              স্ট্যাটাস দেখুন
            </>
          )}
        </Button>
      </form>

      {/* Result Section */}
      {order && (
        <div
          ref={resultRef}
          className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="bg-gradient-to-br from-[#1A0202] via-[#240404] to-[#120000] border border-[#C59B27]/30 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-[#1A0101]/30">
            <div className="absolute top-0 right-0 size-64 bg-[#C59B27]/10 rounded-full blur-[100px] -mr-32 -mt-32" />

            <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#D4A373]">
                  বর্তমান অগ্রগতি
                </p>
                <h3 className="text-3xl font-black tracking-tight text-[#FAF6F0]">
                  Order {order.orderNumber}
                </h3>
                <p className="text-[#FAF6F0]/70 font-bold text-sm">
                  নাম: {order.shipping.name}
                </p>
              </div>
              <div className="text-left md:text-right space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A373]/80">
                  মোট পরিমাণ
                </p>
                <p className="text-3xl font-black text-[#E5B869]">
                  {formatPrice(order.total)}
                </p>
                <span className="inline-block px-3 py-1 rounded-lg bg-white/10 text-[9px] font-black uppercase tracking-widest border border-[#C59B27]/20 text-[#FAF6F0]">
                  পদ্ধতি: {order.paymentMethod}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-16 relative">
              <div className="absolute top-6 left-6 right-6 h-0.5 bg-white/10 hidden md:block" />
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 overflow-hidden">
                {STAGES.map((stage, idx) => {
                  const isActive = getStatusIndex(order.orderStatus) >= idx;
                  const isCurrent = order.orderStatus === stage.id;

                  return (
                    <div
                      key={stage.id}
                      className="relative flex md:flex-col items-center gap-4 md:text-center group"
                    >
                      <div
                        className={cn(
                          "size-12 rounded-2xl flex items-center justify-center transition-all duration-500 relative z-10",
                          isActive
                            ? "bg-gradient-to-r from-[#C59B27] to-[#D4A373] text-[#120000] shadow-lg shadow-[#C59B27]/30 ring-4 ring-[#C59B27]/20"
                            : "bg-white/5 text-white/30",
                        )}
                      >
                        <stage.icon
                          className={cn("size-6", isCurrent && "animate-pulse")}
                        />
                      </div>
                      <div className="space-y-1">
                        <p
                          className={cn(
                            "text-[10px] font-black uppercase tracking-widest transition-colors",
                            isActive ? "text-[#FAF6F0]" : "text-white/30",
                          )}
                        >
                          {stage.label}
                        </p>
                        {isCurrent && (
                          <span className="text-[8px] font-black uppercase tracking-widest bg-[#C59B27]/20 text-[#E5B869] border border-[#C59B27]/30 px-2 py-0.5 rounded-full">
                            সক্রিয়
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/80 dark:bg-[#1A0505]/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-[#2F0C0B]/12 shadow-[0_4px_20px_rgba(42,1,1,0.06)] space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#5C4D4A] dark:text-muted-foreground">
                ডেলিভারি ঠিকানা
              </h4>
              <div className="space-y-1">
                <p className="font-bold text-[#120000] dark:text-foreground">
                  {[
                    order.shipping.addressLine1,
                    order.shipping.addressLine2,
                    order.shipping.city,
                    order.shipping.district,
                  ]
                    .filter((p): p is string => Boolean(p) && !/outside dhaka|inside dhaka|^dhaka$/i.test(p!.trim()))
                    .join(", ") || order.shipping.addressLine1}
                </p>
                <p className="text-xs font-bold text-[#1A0101] dark:text-[#E5B869]">
                  জোন: {order.shipping.deliveryZone || (order.shippingCost > 80 ? "OSD (ঢাকার বাইরে)" : "ISD (ঢাকার ভেতরে)")}
                </p>
              </div>
            </div>
            <div className="bg-white/80 dark:bg-[#1A0505]/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-[#2F0C0B]/12 shadow-[0_4px_20px_rgba(42,1,1,0.06)] space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#5C4D4A] dark:text-muted-foreground">
                সহায়তা কেন্দ্র
              </h4>
              <p className="text-sm font-medium text-[#5C4D4A] dark:text-muted-foreground">
                আপনার অর্ডার নিয়ে কোনো প্রশ্ন বা সহায়তার প্রয়োজন? আমাদের টিম সর্বদা প্রস্তুত।
              </p>
              <a
                href="/contact"
                className="inline-flex items-center text-[#1A0101] dark:text-[#E5B869] font-black uppercase text-[11px] tracking-widest gap-1 hover:underline"
              >
                যোগাযোগ করুন <ChevronRight className="size-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
