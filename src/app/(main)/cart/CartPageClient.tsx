// src/app/(main)/cart/CartPageClient.tsx
"use client";

import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {
  Trash2,
  ShoppingBag,
  ArrowRight,
  PackageX,
  Truck,
  ShieldCheck,
  RotateCcw,
  Package,
  ChevronRight,
} from "lucide-react";
import { formatPrice } from "@/lib/priceUtils";
import QuantitySelector from "@/components/products/QuantitySelector";
import { IPopulatedCartItem } from "@/types/cart";

export default function CartPageClient() {
  const {
    cart,
    cartCount,
    updateQty,
    removeItem,
    isLoadingCart,
    isFetchingCart,
    isAdding,
  } = useCart();

  // ✅ Prevent flash of "আপনার কার্ট খালি" UI while items exist or are being fetched/added
  const isPendingCartDetails =
    isLoadingCart ||
    isAdding ||
    (cartCount > 0 && (!cart.items || cart.items.length === 0)) ||
    (isFetchingCart && (!cart.items || cart.items.length === 0));

  if (isPendingCartDetails) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="size-20 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
          <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
          <div className="h-4 w-56 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  // Ant Design Empty State
  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="max-w-md mx-auto text-center bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-8 sm:p-12 shadow-xs">
          <div className="size-20 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5 text-slate-400">
            <PackageX className="size-10" />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            আপনার কার্ট বর্তমানে খালি
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-xs sm:text-sm leading-relaxed">
            এখনো কোনো খাঁটি ও প্রিমিয়াম খেজুর কার্টে যোগ করা হয়নি। আমাদের সেরা কালেকশন দেখতে এখনই শপ ভিজিট করুন!
          </p>

          <Button
            asChild
            className="h-11 px-6 rounded-lg font-bold text-sm bg-gradient-to-r from-[#1A0101] via-[#240303] to-[#1E0202] hover:from-[#240303] hover:to-[#2D0505] text-white border-none shadow-xs transition-all cursor-pointer"
          >
            <Link href="/products">
              <ShoppingBag className="mr-2 size-4" />
              কেনাকাটা শুরু করুন
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 pb-28 lg:pb-12 space-y-4 overflow-x-hidden min-w-0">
      {/* ── Breadcrumbs (Ant Design Style) ── */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
        <Link href="/" className="hover:text-[#240303] dark:hover:text-[#E5B869] transition-colors shrink-0">
          হোম
        </Link>
        <ChevronRight className="size-3 text-slate-400 shrink-0" />
        <span className="text-slate-800 dark:text-slate-200 font-semibold truncate">
          আপনার কার্ট
        </span>
      </nav>

      {/* ── Page Header (Ant Design Style, 100% Mobile Responsive) ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
            আপনার কার্ট
          </h1>
          <span className="text-xs font-semibold text-[#240303] dark:text-[#E5B869] bg-[#fdf6f0] dark:bg-slate-800 border border-[#240303]/15 px-2 py-0.5 rounded-md shrink-0">
            {cart.items.length}টি আইটেম
          </span>
        </div>
        <Link
          href="/products"
          className="text-xs font-semibold text-[#240303] dark:text-[#E5B869] hover:underline flex items-center gap-1 shrink-0 ml-auto"
        >
          আরও পণ্য যোগ করুন <ArrowRight className="size-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 items-start min-w-0">
        {/* ── Left Column: Cart Items List (Ant Design Card Layout) ── */}
        <section className="lg:col-span-2 space-y-3 min-w-0 w-full" aria-label="কার্ট আইটেম">
          {cart.items.map((item: IPopulatedCartItem) => {
            const product = item.product;
            const itemKey = `${product._id}-${item.color || ""}-${item.size || ""}`;
            const productHref = `/products/${product.category?.slug || "all"}/${product.slug}`;
            const itemTotal = item.subtotal;

            return (
              <article
                key={itemKey}
                className="group relative rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-[#240303]/30 transition-all p-3 sm:p-4 min-w-0 overflow-hidden"
              >
                {/* ── Top Section: Image + Title + Price ── */}
                <div className="flex gap-3 min-w-0">
                  {/* Thumbnail */}
                  <Link
                    href={productHref}
                    className="relative size-18 sm:size-22 shrink-0 overflow-hidden rounded-lg bg-slate-50 border border-slate-200 dark:border-slate-700 aspect-square"
                  >
                    <Image
                      src={product.thumbnail}
                      alt={product.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 72px, 88px"
                    />
                  </Link>

                  {/* Info details */}
                  <div className="flex-1 min-w-0 pr-6 sm:pr-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                        স্টকে আছে
                      </span>
                    </div>

                    <Link href={productHref}>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug hover:text-[#240303] dark:hover:text-[#E5B869] transition-colors line-clamp-2 mb-1">
                        {product.title}
                      </h3>
                    </Link>

                    {/* Variant tags */}
                    {(item.color || item.size) && (
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {item.color && (
                          <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">
                            কালার: {item.color}
                          </span>
                        )}
                        {item.size && (
                          <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded uppercase">
                            সাইজ: {item.size}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Unit price */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs sm:text-sm font-black text-[#240303] dark:text-[#f87171]">
                        {formatPrice(product.salePrice || product.regularPrice)}
                      </span>
                      {product.salePrice && (
                        <span className="text-[10px] text-slate-400 line-through">
                          {formatPrice(product.regularPrice)}
                        </span>
                      )}
                    </div>

                    {/* Desktop Controls (Inline with info on tablet/desktop) */}
                    <div className="hidden sm:flex items-center gap-3 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <QuantitySelector
                        quantity={item.itemQuantity}
                        min={1}
                        max={product.stockQuantity || 10}
                        setQuantity={(val) =>
                          updateQty({
                            productId: product._id,
                            quantity: val,
                            color: item.color,
                            size: item.size,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Desktop Right Column: Delete & Subtotal */}
                  <div className="hidden sm:flex flex-col items-end justify-between pl-3 border-l border-slate-100 dark:border-slate-800 min-w-28 shrink-0">
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      onClick={() => removeItem({ productId: product._id, color: item.color, size: item.size })}
                      aria-label="মুছে ফেলুন"
                      title="আইটেমটি মুছে ফেলুন"
                    >
                      <Trash2 className="size-4" />
                    </button>

                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                        সাবটোটাল
                      </p>
                      <p className="text-base font-black text-[#240303] dark:text-white">
                        {formatPrice(itemTotal)}
                      </p>
                    </div>
                  </div>

                  {/* Mobile Trash Button (Top Right corner) */}
                  <button
                    type="button"
                    className="sm:hidden absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    onClick={() => removeItem({ productId: product._id, color: item.color, size: item.size })}
                    aria-label="মুছে ফেলুন"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                {/* ── Mobile Bottom Row: Dedicated Quantity + Subtotal Row ── */}
                <div className="sm:hidden flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800 w-full min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] text-slate-500 font-medium shrink-0">পরিমাণ:</span>
                    <QuantitySelector
                      quantity={item.itemQuantity}
                      min={1}
                      max={product.stockQuantity || 10}
                      setQuantity={(val) =>
                        updateQty({
                          productId: product._id,
                          quantity: val,
                          color: item.color,
                          size: item.size,
                        })
                      }
                    />
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <span className="text-[10px] text-slate-400 block leading-none">সাবটোটাল</span>
                    <span className="text-sm font-black text-[#240303] dark:text-white">
                      {formatPrice(itemTotal)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* ── Right Column: Order Summary (Ant Design Card) ── */}
        <aside className="lg:col-span-1 space-y-4 min-w-0 w-full" aria-label="অর্ডার সারাংশ">
          <div className="lg:sticky lg:top-20 space-y-4 min-w-0">
            {/* Order Summary Box */}
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xs min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span>অর্ডার সারাংশ</span>
                <span className="text-xs font-normal text-slate-500">
                  {cart.items.length}টি আইটেম
                </span>
              </h2>

              {/* Items Breakdown list */}
              <div className="py-3 space-y-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar border-b border-slate-100 dark:border-slate-800 min-w-0">
                {cart.items.map((item: IPopulatedCartItem) => (
                  <div
                    key={`${item.product._id}-${item.color || ""}-${item.size || ""}`}
                    className="flex justify-between items-start gap-2 text-xs min-w-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.product.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {item.itemQuantity} × {formatPrice(item.product.salePrice || item.product.regularPrice)}
                        {(item.color || item.size) && ` (${[item.color, item.size].filter(Boolean).join(", ")})`}
                      </p>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 shrink-0">
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calculation Rows */}
              <div className="py-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>সাবটোটাল</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatPrice(cart.total)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>ডেলিভারি চার্জ</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    পরবর্তী ধাপে নির্ধারিত হবে
                  </span>
                </div>
              </div>

              {/* Total Row */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline mb-5 min-w-0">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    সর্বমোট
                  </span>
                  <span className="text-[10px] text-slate-400">
                    (ডেলিভারি চার্জ ছাড়া)
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-[#240303] dark:text-[#f87171] shrink-0">
                  {formatPrice(cart.total)}
                </span>
              </div>

              {/* Primary Action Button (Deep Brownish Maroon) */}
              <Button
                asChild
                className="w-full h-11 rounded-lg text-sm font-bold bg-gradient-to-r from-[#1A0101] via-[#240303] to-[#1E0202] hover:from-[#240303] hover:to-[#2D0505] text-white border-none shadow-xs transition-all active:scale-[0.98] group cursor-pointer"
              >
                <Link href="/checkout">
                  চেকআউটে এগিয়ে যান
                  <ArrowRight className="ml-1.5 size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              {/* Ant Design Alert Style Delivery Note */}
              <div className="mt-4 flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <Truck className="size-4 text-[#240303] dark:text-[#E5B869] shrink-0" />
                <p className="text-[11px]">পরবর্তী পেজে নাম, ঠিকানা ও ডেলিভারি এরিয়া সিলেক্ট করুন।</p>
              </div>

              {/* Continue Shopping Link */}
              <div className="pt-3 text-center">
                <Link
                  href="/products"
                  className="text-xs font-semibold text-slate-500 hover:text-[#240303] dark:hover:text-[#E5B869] transition-colors inline-flex items-center gap-1"
                >
                  ← আরও খেজুর বা পণ্য যোগ করুন
                </Link>
              </div>
            </div>

            {/* Trust Badges (Ant Design Card) */}
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs min-w-0">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                আমাদের সেবা ও নিশ্চয়তা
              </h4>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 min-w-0">
                  <ShieldCheck className="size-4 text-[#240303] dark:text-[#E5B869] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">১০০% খাঁটি পণ্য</p>
                    <p className="text-[10px] text-slate-400 truncate">ন্যাচারাল খেজুর</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 min-w-0">
                  <Package className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">ক্যাশ অন ডেলিভারি</p>
                    <p className="text-[10px] text-slate-400 truncate">দেখে মূল্য পরিশোধ</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 min-w-0">
                  <RotateCcw className="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">সহজ রিটার্ন</p>
                    <p className="text-[10px] text-slate-400 truncate">৭ দিনের মধ্যে</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 min-w-0">
                  <Truck className="size-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">দ্রুত ডেলিভারি</p>
                    <p className="text-[10px] text-slate-400 truncate">২৪–৪৮ ঘণ্টার মধ্যে</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Mobile Sticky Bottom Bar (Ant Design Style) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 shadow-lg safe-area-bottom">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              সর্বমোট ({cart.items.length}টি)
            </span>
            <span className="text-lg font-black text-[#240303] dark:text-[#f87171] leading-tight">
              {formatPrice(cart.total)}
            </span>
          </div>

          <Button
            asChild
            className="h-10 px-5 rounded-lg text-xs sm:text-sm font-bold bg-gradient-to-r from-[#1A0101] via-[#240303] to-[#1E0202] text-white border-none shadow-xs flex-1 max-w-[200px]"
          >
            <Link href="/checkout" className="flex items-center justify-center gap-1.5">
              চেকআউট
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
