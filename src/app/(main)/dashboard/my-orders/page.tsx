// src/app/(main)/dashboard/my-orders/page.tsx
import { auth } from "@/auth";
import Order from "@/models/Order";
import User from "@/models/User";
import { dbConnect } from "@/lib/db";
import { cookies } from "next/headers";
import { ClearGuestOrdersCookie } from "@/components/dashboard/ClearGuestOrdersCookie";
import { formatPrice } from "@/lib/priceUtils";
import { format } from "date-fns";
import {
  Package,
  Truck,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

const STATUS_STEPS = [
  { id: "pending", label: "অর্ডার গ্রহণ", icon: Clock },
  { id: "confirmed", label: "নিশ্চিতকৃত", icon: CheckCircle2 },
  { id: "processing", label: "প্রসেসিং", icon: Package },
  { id: "shipped", label: "ডেলিভারিতে", icon: Truck },
  { id: "delivered", label: "সম্পন্ন", icon: CheckCircle2 },
];

export const metadata = {
  title: "আমার অর্ডারসমূহ | খেজুর হাট | খেজুর",
  description: "আপনার সকল অতীত ও বর্তমান অর্ডারের বিবরণ ও লাইভ ট্র্যাকিং স্ট্যাটাস।",
};

export const dynamic = "force-dynamic";

interface OrderItemData {
  productImage: string;
  productTitle: string;
  productPrice: number;
  quantity: number;
}

interface OrderData {
  _id: string;
  orderNumber: string;
  channelSource?: string;
  orderStatus:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "returned";
  total: number;
  discount?: number;
  vipPrivilege?: number;
  advancePaid?: number;
  createdAt: string;
  items: OrderItemData[];
}

async function getUserOrders(userId: string): Promise<OrderData[]> {
  await dbConnect();
  const orders = await Order.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(orders));
}

export default async function UserOrdersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/my-orders");
  }

  await dbConnect();

  // 1. Link guest orders by phone number
  const dbUser = await User.findById(session.user.id)
    .select("phone")
    .lean<{ phone?: string }>();
  if (dbUser?.phone) {
    await Order.updateMany(
      { user: { $exists: false }, customerPhone: dbUser.phone },
      { user: session.user.id }
    );
  }

  // 2. Link guest orders stored in cookies
  const cookieStore = await cookies();
  const guestOrdersVal = cookieStore.get("guest_orders")?.value;
  if (guestOrdersVal) {
    const orderNumbers = guestOrdersVal.split(",");
    if (orderNumbers.length > 0) {
      await Order.updateMany(
        { orderNumber: { $in: orderNumbers }, user: { $exists: false } },
        { user: session.user.id }
      );
    }
  }

  const orders = await getUserOrders(session.user.id!);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {guestOrdersVal && <ClearGuestOrdersCookie />}

      {/* Header */}
      <div className="space-y-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#240303] dark:hover:text-[#E5B869] transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>ড্যাশবোর্ডে ফিরুন</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <ShoppingBag className="size-6 sm:size-7 text-[#240303] dark:text-[#E5B869]" />
              আমার অর্ডারসমূহ
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              আপনার সকল অতীত ও বর্তমান অর্ডারের বিবরণ ও লাইভ ট্র্যাকিং স্ট্যাটাস।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#fdf6f0] dark:bg-slate-800 text-[#240303] dark:text-[#E5B869] border border-[#240303]/10 dark:border-slate-700">
              মোট অর্ডার: {orders.length} টি
            </span>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4 sm:space-y-5">
        {orders.map((order) => {
          const currentStatus = order.orderStatus || "pending";
          const currentStepIndex = STATUS_STEPS.findIndex(
            (step) => step.id === currentStatus
          );

          return (
            <div
              key={order._id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all duration-200 hover:border-[#240303]/30 dark:hover:border-slate-700"
            >
              {/* Order Info Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shadow-2xs shrink-0">
                    <Package className="size-5 text-[#240303] dark:text-[#E5B869]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                      অর্ডার নম্বর
                    </span>
                    <div className="flex items-center gap-2">
                      <p className="text-sm sm:text-base font-mono font-bold text-slate-900 dark:text-white">
                        {order.orderNumber}
                      </p>
                      {Boolean(
                        (order.vipPrivilege && order.vipPrivilege > 0) ||
                          (order.discount && order.discount > 0)
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right ml-auto">
                  <div className="hidden sm:block">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                      তারিখ
                    </span>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {format(new Date(order.createdAt), "dd MMM, yyyy")}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                      {order.advancePaid && order.advancePaid > 0
                        ? "ক্যাশ অন ডেলিভারি"
                        : "সর্বমোট মূল্য"}
                    </span>
                    <p className="text-sm sm:text-base font-black text-[#240303] dark:text-[#E5B869]">
                      {formatPrice(
                        Math.max(0, order.total - (order.advancePaid || 0))
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tracking Progress */}
              {currentStatus !== "cancelled" && currentStatus !== "returned" ? (
                <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="relative flex items-center justify-between max-w-2xl mx-auto">
                    {/* Background Track Line */}
                    <div className="absolute left-0 top-4 w-full h-0.5 bg-slate-200 dark:bg-slate-800" />
                    {/* Active Track Line */}
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
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center bg-rose-50 dark:bg-rose-950/20">
                  <p className="text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                    অর্ডার{" "}
                    {currentStatus === "cancelled"
                      ? "বাতিল করা হয়েছে (Cancelled)"
                      : "ফেরত দেওয়া হয়েছে (Returned)"}
                  </p>
                </div>
              )}

              {/* Items Summary & Link */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-2 overflow-hidden">
                    {order.items.slice(0, 4).map((item, idx) => (
                      <div
                        key={idx}
                        className="relative size-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-2xs shrink-0"
                      >
                        <Image
                          src={item.productImage || "/logo.png"}
                          alt={item.productTitle}
                          fill
                          sizes="40px"
                          className="object-contain p-0.5"
                        />
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="relative size-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs shrink-0">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>

                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {order.items.length} টি পণ্য
                  </span>
                </div>

                <div className="w-full sm:w-auto">
                  <Link
                    href={`/dashboard/my-orders/${order._id}`}
                    className="w-full sm:w-auto block"
                  >
                    <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs transition-all cursor-pointer group">
                      <span>অর্ডারের বিস্তারিত</span>
                      <ChevronRight className="size-4 text-slate-400 group-hover:text-[#240303] dark:group-hover:text-[#E5B869] group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {orders.length === 0 && (
          <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="size-16 bg-[#fdf6f0] dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-[#240303] dark:text-[#E5B869]">
              <ShoppingBag className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              কোনো অর্ডার পাওয়া যায়নি
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
              আপনি এখনও কোনো অর্ডার করেননি। আমাদের প্রিমিয়াম খেজুর ও পণ্য ঘুরে দেখুন।
            </p>
            <Link href="/products">
              <button className="bg-[#240303] hover:bg-[#3a0808] text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-lg shadow-xs transition-all cursor-pointer">
                পণ্য ব্রাউজ করুন
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
