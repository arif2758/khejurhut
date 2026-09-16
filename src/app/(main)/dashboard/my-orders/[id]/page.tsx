// src/app/(main)/dashboard/my-orders/[id]/page.tsx
import { auth } from "@/auth";
import Order from "@/models/Order";
import { dbConnect } from "@/lib/db";
import { formatPrice } from "@/lib/priceUtils";
import { format } from "date-fns";
import {
  Package,
  Truck,
  Clock,
  CheckCircle2,
  ArrowLeft,
  MapPin,
  CreditCard,
  User,
  Phone,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { redirect, notFound } from "next/navigation";
import type { IOrderSerializable } from "@/types/order";

const STATUS_STEPS = [
  { id: "pending", label: "অর্ডার গ্রহণ", icon: Clock },
  { id: "confirmed", label: "নিশ্চিতকৃত", icon: CheckCircle2 },
  { id: "processing", label: "প্রসেসিং", icon: Package },
  { id: "shipped", label: "ডেলিভারিতে", icon: Truck },
  { id: "delivered", label: "সম্পন্ন", icon: CheckCircle2 },
];

const STATUS_TAGS: Record<string, { label: string; className: string }> = {
  pending: {
    label: "অপেক্ষমাণ (Pending)",
    className:
      "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  confirmed: {
    label: "নিশ্চিতকৃত (Confirmed)",
    className:
      "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  processing: {
    label: "প্রসেসিং (Processing)",
    className:
      "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  },
  shipped: {
    label: "ডেলিভারিতে (Shipped)",
    className:
      "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  },
  delivered: {
    label: "সম্পন্ন (Delivered)",
    className:
      "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  cancelled: {
    label: "বাতিল (Cancelled)",
    className:
      "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  },
  returned: {
    label: "ফেরত (Returned)",
    className:
      "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",
  },
};

export const metadata = {
  title: "অর্ডারের বিস্তারিত | খেজুর হাট | খেজুর",
  description: "অর্ডারের পূর্ণাঙ্গ বিবরণ, ট্র্যাকিং স্ট্যাটাস ও শিপিং তথ্য।",
};

async function getOrder(
  id: string,
  userId: string
): Promise<IOrderSerializable | null> {
  await dbConnect();
  const order = await Order.findOne({ _id: id, user: userId }).lean();
  if (!order) return null;
  return JSON.parse(JSON.stringify(order));
}

export default async function UserOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const order = await getOrder(id, session.user.id!);

  if (!order) notFound();

  const currentStatus = order.orderStatus || "pending";
  const currentStepIndex = STATUS_STEPS.findIndex(
    (step) => step.id === currentStatus
  );
  const statusTag = STATUS_TAGS[currentStatus] || STATUS_TAGS.pending;

  const whatsappUrl = `https://wa.me/8801568390014?text=${encodeURIComponent(
    `আসসালামু আলাইকুম, আমার অর্ডার নম্বর: ${order.orderNumber}, এ বিষয়ে জানতে চাচ্ছি।`
  )}`;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-3">
        <Link
          href="/dashboard/my-orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#240303] dark:hover:text-[#E5B869] transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>আমার অর্ডারসমূহে ফিরুন</span>
        </Link>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              অর্ডার বিবরণ
            </span>
            <h1 className="text-xl sm:text-2xl font-mono font-black text-slate-900 dark:text-white">
              {order.orderNumber}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              অর্ডারের তারিখ: {format(new Date(order.createdAt), "dd MMMM, yyyy - hh:mm a")}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
                statusTag.className
              )}
            >
              <CheckCircle2 className="size-3.5" />
              <span>{statusTag.label}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Progress & Items */}
        <div className="lg:col-span-8 space-y-6">
          {/* Progress Tracker Card */}
          {currentStatus !== "cancelled" && currentStatus !== "returned" ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="size-4 text-[#240303] dark:text-[#E5B869]" />
                ডেলিভারি ট্র্যাকিং অগ্রগতি
              </h3>

              <div className="relative flex items-center justify-between max-w-xl mx-auto py-2">
                <div className="absolute left-0 top-4 w-full h-0.5 bg-slate-200 dark:bg-slate-800" />
                <div
                  className="absolute left-0 top-4 h-0.5 bg-[#240303] dark:bg-[#E5B869] transition-all duration-500"
                  style={{
                    width: `${Math.max(
                      0,
                      (currentStepIndex / (STATUS_STEPS.length - 1)) * 100
                    )}%`,
                  }}
                />

                {STATUS_STEPS.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div
                      key={step.id}
                      className="relative z-10 flex flex-col items-center gap-2"
                    >
                      <div
                        className={cn(
                          "size-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                          isCompleted
                            ? "bg-[#240303] border-white dark:border-slate-900 text-white shadow-xs"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600"
                        )}
                      >
                        <step.icon
                          className={cn(
                            "size-3.5",
                            isCurrent && "animate-pulse text-[#E5B869]"
                          )}
                        />
                      </div>
                      <p
                        className={cn(
                          "text-[10px] sm:text-xs font-bold text-center",
                          isCompleted
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-400 dark:text-slate-500"
                        )}
                      >
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 sm:p-5 text-center">
              <p className="text-rose-700 dark:text-rose-400 font-bold text-xs sm:text-sm">
                এই অর্ডারটি {currentStatus === "cancelled" ? "বাতিল" : "ফেরত"} করা হয়েছে।
              </p>
            </div>
          )}

          {/* Items Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="size-4 text-[#240303] dark:text-[#E5B869]" />
                অর্ডারকৃত পণ্যসমূহ
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {order.items.length} টি আইটেম
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 px-4 sm:px-5">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="py-3.5 flex items-center justify-between gap-4 text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="relative size-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0">
                      <Image
                        src={item.productImage || "/logo.png"}
                        alt={item.productTitle}
                        fill
                        sizes="48px"
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {item.productTitle}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        পরিমাণ: {item.itemQuantity} × {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                  </div>

                  <span className="font-bold text-slate-900 dark:text-slate-100 shrink-0 text-right">
                    {formatPrice(item.unitPrice * item.itemQuantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Customer & Financial Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Shipping Details */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <MapPin className="size-4 text-[#240303] dark:text-[#E5B869]" />
              ডেলিভারি ও গ্রাহকের ঠিকানা
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <User className="size-3.5 text-slate-400 shrink-0" />
                <span className="font-bold">{order.shipping.name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Phone className="size-3.5 text-slate-400 shrink-0" />
                <span>{order.shipping.phone}</span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 pl-5.5 leading-relaxed">
                {order.shipping.addressLine1}
                {order.shipping.city ? `, ${order.shipping.city}` : ""}
                {order.shipping.district ? `, ${order.shipping.district}` : ""}
              </div>
              {order.shipping.deliveryZone && (
                <div className="pt-1">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#fdf6f0] dark:bg-slate-800 text-[#240303] dark:text-[#E5B869] border border-[#240303]/10 dark:border-slate-700">
                    এরিয়া: {order.shipping.deliveryZone}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method & Status */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <CreditCard className="size-4 text-[#240303] dark:text-[#E5B869]" />
              পেমেন্ট তথ্য
            </h3>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>পদ্ধতি:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {order.paymentMethod === "cod"
                    ? "ক্যাশ অন ডেলিভারি"
                    : `মোবাইল ব্যাংকিং (${order.paymentProvider || ""})`}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>স্ট্যাটাস:</span>
                <span className="font-bold capitalize text-slate-800 dark:text-slate-200">
                  {order.paymentStatus || "Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-2 text-xs sm:text-sm">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              হিসাবের সারসংক্ষেপ
            </h3>

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>সাবটোটাল</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>ডেলিভারি চার্জ</span>
              <span>{formatPrice(order.shippingCost)}</span>
            </div>
            {order.discount ? (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>ডিসকাউন্ট</span>
                <span>- {formatPrice(order.discount)}</span>
              </div>
            ) : null}

            <div className="flex justify-between font-black text-sm sm:text-base text-[#240303] dark:text-[#E5B869] pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>সর্বমোট</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* WhatsApp Support Link */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors"
          >
            <MessageCircle className="size-4" />
            <span>এই অর্ডার নিয়ে WhatsApp-এ সহায়তা নিন</span>
          </a>
        </div>
      </div>
    </div>
  );
}
