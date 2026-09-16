// src/components/product/ProductTabs.tsx
"use client";

import { useState } from "react";
import { ScrollText, Info, ListChecks, Truck, ShieldCheck, CheckCircle2, RotateCcw, Package } from "lucide-react";
import type { IProductSpecification } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductTabsProps {
  description: string;
  specifications: IProductSpecification[];
  features?: string[];
  stockQuantity: number;
}

type TabKey = "description" | "specifications" | "features" | "delivery";

export function ProductTabs({
  description,
  specifications,
  features,
  stockQuantity,
}: ProductTabsProps) {
  const hasFeatures = Boolean(features && features.length > 0);
  const hasSpecs = Boolean(specifications && specifications.length > 0);

  const [activeTab, setActiveTab] = useState<TabKey>("description");

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { key: "description", label: "বিস্তারিত বিবরণ", icon: ScrollText },
    ...(hasSpecs ? [{ key: "specifications" as TabKey, label: "স্পেসিফিকেশন", icon: Info, count: specifications.length }] : []),
    ...(hasFeatures ? [{ key: "features" as TabKey, label: "মূল বৈশিষ্ট্যসমূহ", icon: ListChecks, count: features?.length }] : []),
    { key: "delivery", label: "ডেলিভারি ও রিটার্ন", icon: Truck },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
      {/* ── Ant Design Style Tab Header ── */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-3 sm:px-6">
        <nav
          className="flex items-center gap-1 sm:gap-6 overflow-x-auto whitespace-nowrap scrollbar-none"
          aria-label="Product details tabs"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative flex items-center gap-2 py-3.5 sm:py-4 px-2 sm:px-1 text-xs sm:text-sm font-medium transition-colors cursor-pointer select-none",
                  isActive
                    ? "text-[#240303] dark:text-[#E5B869] font-bold"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                <Icon className={cn("size-4 shrink-0", isActive ? "text-[#240303] dark:text-[#E5B869]" : "text-slate-400")} />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      isActive
                        ? "bg-[#240303]/10 text-[#240303] dark:bg-[#E5B869]/20 dark:text-[#E5B869]"
                        : "bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
                {/* AntD Active Underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#240303] dark:bg-[#E5B869] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Tab Content Panel ── */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* 1. Description Tab */}
        {activeTab === "description" && (
          <div className="min-w-0">
            {description ? (
              <div
                className="prose prose-sm max-w-none break-words
                  prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-headings:border-b prose-headings:border-slate-100 dark:prose-headings:border-slate-800 prose-headings:pb-2 prose-headings:mb-3
                  prose-h3:text-sm sm:prose-h3:text-base prose-h3:mt-5 first:prose-h3:mt-0
                  prose-h4:text-xs sm:prose-h4:text-sm prose-h4:mt-4
                  prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-3 prose-p:text-sm
                  prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-bold
                  prose-ul:space-y-1.5 prose-ul:my-3 prose-ul:pl-5
                  prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-li:leading-relaxed prose-li:text-sm
                  prose-li:marker:text-[#240303]
                  dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">কোনো বিস্তারিত বিবরণ প্রদান করা হয়নি।</p>
            )}
          </div>
        )}

        {/* 2. Specifications Tab (Ant Design Descriptions Pattern) */}
        {activeTab === "specifications" && (
          <div className="space-y-4">
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <tbody>
                  {specifications.map((spec, idx) => (
                    <tr
                      key={idx}
                      className={cn(
                        "border-b border-slate-200 dark:border-slate-700 last:border-b-0",
                        idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-800/40"
                      )}
                    >
                      <td className="py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 w-1/3 sm:w-1/4 border-r border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60">
                        {spec.key}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-100">
                        {spec.value}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-white dark:bg-slate-900">
                    <td className="py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60">
                      স্টক স্ট্যাটাস
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {stockQuantity > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 px-2.5 py-1 rounded-md">
                          <Package className="size-3.5 text-emerald-600" /> স্টকে আছে ({stockQuantity} পিস)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
                          স্টক শেষ
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Features Tab */}
        {activeTab === "features" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features?.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
              >
                <div className="flex items-center justify-center size-5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 shrink-0 mt-0.5">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 4. Delivery & Returns Tab (Ant Design Info Grid) */}
        {activeTab === "delivery" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 space-y-2">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-sm">
                <Truck className="size-4 text-[#240303] dark:text-[#E5B869]" />
                <span>সারা বাংলাদেশে হোম ডেলিভারি</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                ঢাকা সিটির ভেতর ২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি। ঢাকার বাইরে ২ থেকে ৩ কার্যদিবসের মধ্যে ডেলিভারি সম্পন্ন হয়।
              </p>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 space-y-2">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-sm">
                <RotateCcw className="size-4 text-[#240303] dark:text-[#E5B869]" />
                <span>৭ দিনের সহজ রিটার্ন পলিসি</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                পণ্য হাতে পাওয়ার পর কোনো ত্রুটি বা অসঙ্গতি পরিলক্ষিত হলে ৭ দিনের মধ্যে বিনামূল্যে পরিবর্তন বা রিটার্ন সুবিধা।
              </p>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 space-y-2">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-sm">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>১০০% খাঁটি ও প্রিমিয়াম মান</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                আমাদের প্রতিটি খেজুর সরাসরি বাছাইকৃত ও স্বাস্থ্যসম্মত উপায়ে প্যাকেটজাত করা। কোনো ভেজাল বা কৃত্রিম কেমিক্যাল মুক্ত।
              </p>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 space-y-2">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-sm">
                <Package className="size-4 text-amber-600" />
                <span>ক্যাশ অন ডেলিভারি সুবিধা</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                পণ্য চেক করে হাতে পেয়ে টাকা পরিশোধ করার পূর্ণ নিশ্চয়তা। কোনো অগ্রিম পেমেন্টের ঝুঁকি নেই।
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
