"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ShoppingBag,
  Package,
  Truck,
  Phone,
  ArrowRight,
  Copy,
  Check,
  Clock,
  MapPin,
  CreditCard,
  MessageCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/priceUtils";
import { AccountClaimForm } from "./AccountClaimForm";

interface OrderItem {
  productId?: string;
  productTitle: string;
  productSlug?: string;
  productImage?: string;
  unitPrice: number;
  itemQuantity: number;
}

interface OrderData {
  orderNumber: string;
  orderStatus: string;
  paymentMethod: "cod" | "mobile";
  paymentProvider?: string;
  subtotal: number;
  shippingCost: number;
  discount?: number;
  total: number;
  items?: OrderItem[];
  shipping?: {
    name?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    district?: string;
    deliveryZone?: string;
  };
  createdAt?: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const { data: session } = useSession();

  const [copied, setCopied] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  useEffect(() => {
    if (orderNumber) {
      // Save guest order to cookies
      const cookiesArr = document.cookie.split("; ");
      const guestOrdersCookie = cookiesArr.find((row) =>
        row.startsWith("guest_orders=")
      );
      let existingOrders: string[] = [];
      if (guestOrdersCookie) {
        existingOrders = decodeURIComponent(
          guestOrdersCookie.split("=")[1]
        ).split(",");
      }
      if (!existingOrders.includes(orderNumber)) {
        existingOrders.push(orderNumber);
        document.cookie = `guest_orders=${encodeURIComponent(
          existingOrders.join(",")
        )}; path=/; max-age=31536000; SameSite=Lax`;
      }

      // Fetch order details
      setLoadingOrder(true);
      fetch(`/api/order/track?orderId=${encodeURIComponent(orderNumber)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.order) {
            setOrder(data.order);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingOrder(false));
    }
  }, [orderNumber]);

  const handleCopy = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      toast.success("অর্ডার নম্বর কপি করা হয়েছে!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const whatsappUrl = `https://wa.me/8801568390014?text=${encodeURIComponent(
    `আসসালামু আলাইকুম, আমার অর্ডার নম্বর: ${orderNumber || ""}, এ বিষয়ে জানতে চাচ্ছি।`
  )}`;

  return (
    <div className="container mx-auto px-4 py-8 sm:py-14">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Ant Design Result Hero */}
        <div className="text-center space-y-4">
          <div className="size-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-2xs animate-in zoom-in-75 duration-300">
            <CheckCircle2 className="size-10 stroke-[2.5px]" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              অর্ডার সফল হয়েছে!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। আমাদের কাস্টমার সার্ভিস প্রতিনিধি খুব শীঘ্রই কল করে অর্ডারটি নিশ্চিত করবেন।
            </p>
          </div>
        </div>

        {/* Order Identifier & Status Banner */}
        {orderNumber && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="size-10 rounded-lg bg-[#fdf6f0] dark:bg-slate-800 flex items-center justify-center text-[#240303] dark:text-[#E5B869] shrink-0">
                <Package className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    অর্ডার নম্বর:
                  </span>
                  <span className="font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight">
                    {orderNumber}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  অর্ডার সংক্রান্ত তথ্যের জন্য এই আইডিটি সংরক্ষণ করুন
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer active:scale-95"
              >
                {copied ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5 text-slate-500" />
                )}
                <span>{copied ? "কপি হয়েছে" : "কপি করুন"}</span>
              </button>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <Clock className="size-3" />
                অপেক্ষমাণ (Pending)
              </span>
            </div>
          </div>
        )}

        {/* Order Details Card (If Loaded) */}
        {order && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs space-y-0 animate-in fade-in duration-300">
            {/* Header */}
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="size-4 text-[#240303] dark:text-[#E5B869]" />
                অর্ডারের বিবরণ
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                মোট পণ্য: {order.items?.length || 0} টি
              </span>
            </div>

            {/* Items List */}
            {order.items && order.items.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 px-4 sm:px-5">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="py-3 flex items-center justify-between gap-3 text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {item.productImage ? (
                        <div className="relative size-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700">
                          <Image
                            src={item.productImage}
                            alt={item.productTitle}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="size-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100 dark:border-slate-700">
                          <Package className="size-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate leading-snug">
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
            )}

            {/* Delivery & Payment Info */}
            <div className="bg-slate-50/60 dark:bg-slate-800/40 p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-slate-400" />
                  ডেলিভারি ঠিকানা:
                </p>
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  {order.shipping?.name} • {order.shipping?.phone}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  {order.shipping?.addressLine1}
                  {order.shipping?.city ? `, ${order.shipping.city}` : ""}
                  {order.shipping?.district ? `, ${order.shipping.district}` : ""}
                </p>
              </div>

              <div className="space-y-1 sm:text-right">
                <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center sm:justify-end gap-1.5">
                  <CreditCard className="size-3.5 text-slate-400" />
                  পেমেন্ট পদ্ধতি:
                </p>
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  {order.paymentMethod === "cod"
                    ? "ক্যাশ অন ডেলিভারি (Cash on Delivery)"
                    : `মোবাইল ব্যাংকিং (${order.paymentProvider || ""})`}
                </p>
                {order.shipping?.deliveryZone && (
                  <p className="text-slate-500 dark:text-slate-400">
                    এরিয়া: {order.shipping.deliveryZone}
                  </p>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="px-4 sm:px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs sm:text-sm">
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
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/products" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto rounded-lg h-11 px-6 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold shadow-2xs cursor-pointer transition-all"
            >
              <ShoppingBag className="mr-2 size-4" />
              আরও কেনাকাটা করুন
            </Button>
          </Link>

          <Link
            href={
              orderNumber
                ? `/track-order?orderId=${encodeURIComponent(orderNumber)}`
                : "/track-order"
            }
            className="w-full sm:w-auto"
          >
            <Button
              size="lg"
              className="w-full sm:w-auto rounded-lg h-11 px-6 bg-[#240303] hover:bg-[#3a0808] text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer transition-all group"
            >
              অর্ডার ট্র্যাক করুন
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Account Claiming Form for Guest Users */}
        {!session && orderNumber && (
          <AccountClaimForm orderNumber={orderNumber} />
        )}

        {/* Support Footer */}
        <div className="pt-4 flex items-center justify-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:text-[#240303] dark:hover:text-[#E5B869] transition-colors"
          >
            <MessageCircle className="size-4 text-emerald-600" />
            <span>কোনো জিজ্ঞাসা থাকলে সরাসরি WhatsApp-এ কথা বলুন</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-20 text-center text-sm text-slate-500">
          লোডিং...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
