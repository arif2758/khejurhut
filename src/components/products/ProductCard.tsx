// src/components/products/ProductCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star, Loader2, Heart, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPrice, calculateDiscount } from "@/lib/priceUtils";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";
import QuantitySelector from "@/components/products/QuantitySelector";

// Type Imports
import type { IProduct } from "@/types/product";
import type { ICartItem, IPopulatedCartItem } from "@/types/cart";
import { ICategory } from "@/types/category";
import { useState } from "react";

export default function ProductCard({ product, priority = false }: { product: IProduct; priority?: boolean }) {
  const {
    cart,
    addToCart,
    updateQty,
    removeItem,
    isAdding, 
    isUpdating,
    isRemoving,
  } = useCart();

  const { wishlistIds, toggleWishlist } = useWishlist();

  // Price calculations
  const discountPercentage = calculateDiscount(
    product.regularPrice,
    product.salePrice,
  );
  const displayPrice = product?.salePrice || product?.regularPrice;

  // Type Guards for slug routing
  const getCategorySlug = (): string => {
    const cat = product.category;

    // চেক করছি cat একটি অবজেক্ট কিনা এবং তার মধ্যে 'slug' প্রপার্টি আছে কিনা
    if (typeof cat === "object" && cat !== null && "slug" in cat) {
      // এখানে আমরা Next.js/TypeScript কে বলছি, "হ্যাঁ, আমি শিওর এটা ICategory"
      return (cat as ICategory).slug;
    }

    return "uncategorized";
  };

  const productHref = `/products/${getCategorySlug()}/${product.slug}`;

  // Cart Matcher Logic
  const cartItem = cart?.items?.find((item: ICartItem | IPopulatedCartItem) => {
    const itemProductId =
      typeof item.product === "object" &&
      item.product !== null &&
      "_id" in item.product
        ? String(item.product._id)
        : String(item.product);
    return itemProductId === String(product._id);
  });

  const isInCart = !!cartItem;
  const currentQty = cartItem?.itemQuantity || 0;
  const isActionPending = isAdding || isUpdating || isRemoving;
  const [showSuccess, setShowSuccess] = useState(false);

  // Handlers
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stockQuantity === 0) return toast.error("স্টক নেই!");

    // ইনস্ট্যান্ট ফিডব্যাক দেওয়ার জন্য
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    addToCart(
      { productId: String(product._id), quantity: 1 },
      {
        onSuccess: (data: { success?: boolean }) => {
          if (data?.success) {
            toast.success(`${product.title} কার্টে যোগ করা হয়েছে!`, {
              icon: <ShoppingCart className="size-4" />,
              duration: 1500,
            });
          }
        },
      },
    );
  };

  const handleIncrease = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (currentQty < product.stockQuantity) {
      updateQty({
        productId: String(product._id),
        quantity: currentQty + 1,
      });
    } else {
      toast.error(`সর্বোচ্চ স্টক লিমিট ${product.stockQuantity} টি`);
    }
  };

  const handleDecrease = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (currentQty > 1) {
      updateQty({
        productId: String(product._id),
        quantity: currentQty - 1,
      });
    } else {
      removeItem(
        { productId: String(product._id) },
        {
          onSuccess: () => toast.info("কার্ট থেকে রিমুভ করা হয়েছে"),
        },
      );
    }
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_-6px_rgba(157,28,32,0.12),0_4px_8px_-4px_rgba(0,0,0,0.04)] hover:border-[#9D1C20]/40 transition-all duration-300 hover:-translate-y-1">
      {/* 1. Image Container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-slate-50 dark:bg-slate-950">
        <Link href={productHref} className="absolute inset-0 z-0 block">
          <Image
            src={product.thumbnail}
            alt={`${product.title} price in Bangladesh - GadgeterHub`}
            fill
            priority={priority}
            className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute left-3 top-3 z-10 px-2.5 py-0.5 rounded-md bg-gradient-to-r from-[#1A0101] to-[#280404] text-[#E5B869] text-[11px] font-bold tracking-tight shadow-sm border border-[#C59B27]/20">
            {discountPercentage}% OFF
          </div>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist({ productId: String(product._id) });
          }}
          className={cn(
            "absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-300 shadow-sm active:scale-90 hover:bg-slate-50 hover:border-[#240303]/40",
            wishlistIds.includes(String(product._id))
              ? "text-rose-500 scale-105 shadow-rose-500/20 border-rose-500/30 bg-white"
              : "text-slate-600 dark:text-slate-300",
          )}
        >
          <Heart
            className={cn(
              "size-4 transition-all duration-300",
              wishlistIds.includes(String(product._id)) && "fill-rose-500 text-rose-500",
            )}
          />
        </button>

        {/* Out of Stock Overlay */}
        {product.stockQuantity === 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 dark:bg-slate-900/80">
            <Badge
              variant="destructive"
              className="px-4 py-1.5 text-sm font-medium tracking-wide shadow-xl"
            >
              স্টক শেষ
            </Badge>
          </div>
        )}
      </div>

      {/* 2. Content Container */}
      <div className="flex flex-1 flex-col p-4 sm:p-5 bg-white dark:bg-slate-900">
        <div className="mb-4 flex flex-1 flex-col">
          <div className="mb-1.5 flex items-start justify-between gap-3">
            <Link href={productHref} className="flex-1">
              <h3 className="line-clamp-2 text-base sm:text-[17px] font-bold leading-tight text-slate-900 dark:text-white transition-colors group-hover:text-[#240303]">
                {product.title}
              </h3>
            </Link>

            {/* Rating right beside title */}
            <div className="mt-0.5 flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-500">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span>{product.ratings?.average || "0.0"}</span>
            </div>
          </div>

          <p className="line-clamp-2 text-sm leading-snug text-slate-500 dark:text-slate-400">
            {product.shortDesc}
          </p>
        </div>

        {/* Price & Actions */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Price Stack */}
          <div className="flex flex-col gap-0.5">
            {/* Sale Price FIRST */}
            <span className="text-xl sm:text-2xl font-black leading-none text-[#240303] dark:text-[#f87171]">
              {formatPrice(displayPrice)}
            </span>

            {/* Regular Price AFTER */}
            {discountPercentage > 0 && (
              <span className="text-slate-400 line-through text-xs sm:text-sm tracking-wide">
                {formatPrice(product.regularPrice)}
              </span>
            )}
          </div>

          {/* Dynamic Action Area */}
          <div className="relative z-10 flex min-w-27.5 shrink-0 justify-end">
            {!isInCart ? (
              <button
                onClick={handleAddToCart}
                disabled={product.stockQuantity === 0 || isActionPending}
                className={cn(
                  "flex h-9.5 items-center justify-center gap-1.5 rounded-xl px-3.5 text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-sm",
                  showSuccess
                    ? "bg-emerald-600 text-white"
                    : "bg-gradient-to-r from-[#1A0101] via-[#240303] to-[#1E0202] hover:from-[#240303] hover:to-[#2D0505] text-[#FAF6F0] border-none shadow-[#1A0101]/25 hover:shadow-md hover:shadow-[#1A0101]/35 hover:scale-[1.02]",
                )}
              >
                {showSuccess ? (
                  <Check className="size-4 shrink-0 text-white" />
                ) : isActionPending ? (
                  <Loader2 className="size-4 animate-spin text-[#D4A373]" />
                ) : (
                  <ShoppingCart className="size-4 shrink-0 text-[#D4A373]" />
                )}
                <span>{showSuccess ? "যোগ হয়েছে" : "কার্টে যোগ করুন"}</span>
              </button>
            ) : (
              /* State 2: Quantity Selector - Centralized */
              <QuantitySelector
                quantity={currentQty}
                setQuantity={(val) => {
                  if (val > currentQty) handleIncrease();
                  else handleDecrease();
                }}
                min={1}
                max={product.stockQuantity}
                variant="compact"
                className="w-28"
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
