import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { redirect } from "next/navigation";
import Order from "@/models/Order";
import User from "@/models/User";
import { cookies } from "next/headers";
import { ClearGuestOrdersCookie } from "@/components/dashboard/ClearGuestOrdersCookie";
import { formatPrice } from "@/lib/priceUtils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ShoppingBag,
  MapPin,
  Heart,
  User as UserIcon,
  History,
  ArrowRight,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  ListOrdered,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "ড্যাশবোর্ড ওভারভিউ | খেজুর হাট | খেজুর",
  description: "আপনার একাউন্ট ওভারভিউ, সাম্প্রতিক অর্ডার এবং প্রোফাইল ম্যানেজ করুন।",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof Clock; className: string }
> = {
  pending: {
    label: "অপেক্ষমাণ",
    icon: Clock,
    className:
      "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  },
  confirmed: {
    label: "নিশ্চিতকৃত",
    icon: CheckCircle2,
    className:
      "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  },
  processing: {
    label: "প্রসেসিং",
    icon: Package,
    className:
      "text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800",
  },
  shipped: {
    label: "ডেলিভারিতে",
    icon: Truck,
    className:
      "text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
  },
  delivered: {
    label: "সম্পন্ন",
    icon: CheckCircle2,
    className:
      "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  },
  cancelled: {
    label: "বাতিল",
    icon: Package,
    className:
      "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
  },
};

interface RecentOrderData {
  _id: string;
  orderNumber: string;
  orderStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  advancePaid?: number;
  createdAt: string;
}

async function getDashboardStats(userId: string) {
  await dbConnect();

  const userRecord = await User.findById(userId)
    .select("wishlist phone")
    .lean<{ wishlist: string[]; phone?: string }>();

  // 1. Link guest orders by phone number
  if (userRecord?.phone) {
    await Order.updateMany(
      { user: { $exists: false }, customerPhone: userRecord.phone },
      { user: userId }
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
        { user: userId }
      );
    }
  }

  const [orderCount, recentOrders] = await Promise.all([
    Order.countDocuments({ user: userId }),
    Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("_id orderNumber orderStatus total advancePaid createdAt")
      .lean(),
  ]);

  return {
    orderCount,
    wishlistCount: userRecord?.wishlist?.length || 0,
    recentOrders: JSON.parse(JSON.stringify(recentOrders)) as RecentOrderData[],
    hasGuestOrders: !!guestOrdersVal,
  };
}

const NAV_CARDS = [
  {
    href: "/dashboard/my-orders",
    title: "আমার অর্ডারসমূহ",
    subtitle: "অর্ডার ট্র্যাক ও ম্যানেজ করুন",
    icon: ShoppingBag,
    iconColor: "text-[#240303] dark:text-[#E5B869]",
    iconBg: "bg-[#fdf6f0] dark:bg-slate-800",
  },
  {
    href: "/dashboard/wishlist",
    title: "পছন্দের পণ্য",
    subtitle: "সংরক্ষিত খেজুর ও আইটেম",
    icon: Heart,
    iconColor: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-50 dark:bg-rose-950/40",
  },
  {
    href: "/dashboard/addresses",
    title: "ডেলিভারি ঠিকানা",
    subtitle: "শিপিং এড্রেস সংরক্ষণ করুন",
    icon: MapPin,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    href: "/dashboard/profile",
    title: "প্রোফাইল সেটিংস",
    subtitle: "ব্যক্তিগত তথ্য ও পাসওয়ার্ড",
    icon: UserIcon,
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
  },
];

export default async function DashboardOverview() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const stats = await getDashboardStats(session.user.id!);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {stats.hasGuestOrders && <ClearGuestOrdersCookie />}

      {/* Greeting Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fdf6f0] dark:bg-slate-800 text-[#240303] dark:text-[#E5B869] border border-[#240303]/10 dark:border-slate-700 w-fit">
              <span>কাস্টমার ড্যাশবোর্ড</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              স্বাগতম,{" "}
              <span className="text-[#240303] dark:text-[#E5B869]">
                {session.user.name?.split(" ")[0] || "গ্রাহক"}!
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
              আপনার একাউন্টের সামগ্রিক বিবরণ। এখান থেকে আপনার অর্ডার ট্র্যাক, প্রোফাইল সেটিংস ও সংরক্ষিত পণ্য দেখতে পারবেন।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-lg p-3 sm:p-4 text-center min-w-[105px]">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {stats.orderCount}
              </p>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                মোট অর্ডার
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-lg p-3 sm:p-4 text-center min-w-[105px]">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {stats.wishlistCount}
              </p>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                পছন্দের তালিকা
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Dashboard Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick Navigation Grid */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            দ্রুত নেভিগেশন
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {NAV_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href} className="group">
                  <div className="h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:border-[#240303]/40 dark:hover:border-[#E5B869]/40 hover:shadow-sm transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={cn(
                          "size-11 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform",
                          card.iconBg,
                          card.iconColor
                        )}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#240303] dark:group-hover:text-[#E5B869] transition-colors truncate">
                          {card.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                          {card.subtitle}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-slate-300 group-hover:text-[#240303] dark:group-hover:text-[#E5B869] group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Payment History Teaser Card */}
          <Link
            href="/dashboard/payments"
            className="block relative overflow-hidden bg-[#240303] text-white rounded-xl p-4 sm:p-5 hover:bg-[#2e0505] shadow-xs transition-all group mt-3.5"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="size-11 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                  <History className="size-5 text-[#E5B869]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-[#E5B869] transition-colors truncate">
                    পেমেন্ট হিস্ট্রি ও ইনভয়েস
                  </h3>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">
                    আপনার পূর্ববর্তী সকল অর্ডারের ইনভয়েস ও লেনদেনের রেকর্ড
                  </p>
                </div>
              </div>
              <ArrowRight className="size-4 text-white/60 group-hover:translate-x-1 group-hover:text-[#E5B869] transition-all shrink-0" />
            </div>
          </Link>
        </div>

        {/* Right Column: Recent Activity / Orders */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              সাম্প্রতিক অর্ডার
            </h2>
            <Link
              href="/dashboard/my-orders"
              className="text-xs font-bold text-[#240303] dark:text-[#E5B869] hover:underline underline-offset-4 flex items-center gap-1"
            >
              <span>সবগুলো দেখুন</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
            {stats.recentOrders.length > 0 ? (
              stats.recentOrders.map((order) => {
                const config =
                  STATUS_CONFIG[order.orderStatus || "pending"] ||
                  STATUS_CONFIG.pending;
                const StatusIcon = config.icon;
                return (
                  <Link
                    key={order._id}
                    href={`/dashboard/my-orders/${order._id}`}
                    className="group block py-3 first:pt-0 last:pb-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "size-9 rounded-lg flex items-center justify-center shrink-0 border",
                            config.className
                          )}
                        >
                          <StatusIcon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight group-hover:text-[#240303] dark:group-hover:text-[#E5B869] transition-colors truncate">
                            {order.orderNumber}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {format(new Date(order.createdAt), "dd MMM, yyyy")}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {formatPrice(
                            Math.max(0, order.total - (order.advancePaid || 0))
                          )}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5",
                            config.className
                          )}
                        >
                          {config.label}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="text-center py-8 px-4">
                <ListOrdered className="size-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  কোনো সাম্প্রতিক অর্ডার নেই
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  আপনার দেওয়া নতুন অর্ডার এখানে প্রদর্শিত হবে।
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
