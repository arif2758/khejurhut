// src/app/(main)/dashboard/payments/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";
import { formatPrice } from "@/lib/priceUtils";
import { format } from "date-fns";
import {
  History,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  Clock,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "পেমেন্ট হিস্ট্রি | খেজুর হাট | খেজুর",
  description: "আপনার পূর্ববর্তী সকল লেনদেন ও পেমেন্ট রেকর্ডের বিবরণ।",
};

interface PaymentRecord {
  _id: string;
  orderNumber: string;
  total: number;
  advancePaid?: number;
  paymentMethod: string;
  paymentStatus?: string;
  createdAt: string;
}

async function getPayments(userId: string): Promise<PaymentRecord[]> {
  await dbConnect();
  const orders = await Order.find({ user: userId })
    .select("_id orderNumber total advancePaid paymentMethod paymentStatus createdAt")
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(orders));
}

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const payments = await getPayments(session.user.id!);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
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
              <History className="size-6 sm:size-7 text-[#240303] dark:text-[#E5B869]" />
              পেমেন্ট হিস্ট্রি ও ইনভয়েস
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              আপনার সকল পূর্ববর্তী লেনদেন, পেমেন্ট পদ্ধতি ও অর্ডারের মূল্যতালিকা।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#fdf6f0] dark:bg-slate-800 text-[#240303] dark:text-[#E5B869] border border-[#240303]/10 dark:border-slate-700">
              মোট লেনদেন: {payments.length} টি
            </span>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        {payments.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {payments.map((payment) => {
              const isPaid =
                payment.paymentStatus === "paid" ||
                payment.paymentStatus === "completed";
              return (
                <div
                  key={payment._id}
                  className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "size-11 rounded-lg flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105",
                        isPaid
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                          : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                      )}
                    >
                      <CreditCard className="size-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white">
                          {payment.orderNumber}
                        </h4>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border",
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                          )}
                        >
                          {isPaid ? (
                            <CheckCircle2 className="size-3" />
                          ) : (
                            <Clock className="size-3" />
                          )}
                          <span>
                            {isPaid ? "পরিশোধিত" : "অপেক্ষমাণ (Pending)"}
                          </span>
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        {format(
                          new Date(payment.createdAt),
                          "dd MMM, yyyy - hh:mm a"
                        )}{" "}
                        • পদ্ধতি:{" "}
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {payment.paymentMethod === "cod"
                            ? "ক্যাশ অন ডেলিভারি"
                            : "মোবাইল ব্যাংকিং"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                        {payment.advancePaid && payment.advancePaid > 0
                          ? "ক্যাশ অন ডেলিভারি"
                          : "পরিশোধযোগ্য মূল্য"}
                      </span>
                      <p className="text-sm sm:text-base font-black text-[#240303] dark:text-[#E5B869]">
                        {formatPrice(
                          Math.max(0, payment.total - (payment.advancePaid || 0))
                        )}
                      </p>
                    </div>

                    <Link href={`/dashboard/my-orders/${payment._id}`}>
                      <button className="size-9 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-[#240303] dark:hover:text-[#E5B869] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer">
                        <ChevronRight className="size-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="size-16 bg-[#fdf6f0] dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-[#240303] dark:text-[#E5B869]">
              <History className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              কোনো লেনদেনের তথ্য নেই
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
              আপনার সম্পন্ন করা অর্ডার ও পেমেন্টের সকল তথ্য এখানে প্রদর্শিত হবে।
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
