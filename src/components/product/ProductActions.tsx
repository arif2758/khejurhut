// src\components\product\ProductActions.tsx
"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import QuantitySelector from "@/components/products/QuantitySelector";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Zap, Truck, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ICartItem, IPopulatedCartItem } from "@/types/cart";

import { WhatsAppOrderButton } from "./WhatsAppOrderButton"; 
import { CallOrderButton } from "./CallOrderButton";
import { IProduct } from "@/types/product"; 

interface ProductActionsProps {
  productId: string;
  productTitle: string;
  stock: number;
  product: IProduct;
}

export function ProductActions({
  productId,
  productTitle,
  stock,
  product
}: ProductActionsProps) {
  const {
    addToCart,
    isAdding,
    cart,
    updateQty,
    isUpdating,
    removeItem,
    isRemoving,
    isLoadingCart,
  } = useCart();
  const router = useRouter();

  // Selected Options (Default to first available option as requested)
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors && product.colors.length > 0 ? product.colors[0] : ""
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : ""
  );

  // কার্টে আছে কিনা চেক করো (productId + color + size)
  const cartItem = cart?.items?.find((item: ICartItem | IPopulatedCartItem) => {
    const itemProductId =
      typeof item.product === "object" &&
      item.product !== null &&
      "_id" in item.product
        ? String(item.product._id)
        : String(item.product);

    const matchesColor = (item.color || "") === (selectedColor || "");
    const matchesSize = (item.size || "") === (selectedSize || "");

    return itemProductId === productId && matchesColor && matchesSize;
  });

  const isInCart = !!cartItem;
  const currentQtyInCart = cartItem?.itemQuantity || 0;

  // লোকাল স্টেট শুধুমাত্র তখন ব্যবহার হবে যখন প্রোডাক্ট কার্টে নেই
  const [localQty, setLocalQty] = useState(1);
  const displayQty = isInCart ? currentQtyInCart : localQty;

  const isActionPending = isAdding || isUpdating || isRemoving || isLoadingCart;
  const isDisabled = isActionPending || stock <= 0;

  const handleQtyChange = (newQty: number) => {
    if (isInCart) {
      if (newQty > currentQtyInCart) {
        updateQty({ productId, quantity: newQty, color: selectedColor, size: selectedSize });
      } else if (newQty < currentQtyInCart) {
        if (newQty === 0) {
          removeItem({ productId, color: selectedColor, size: selectedSize });
        } else {
          updateQty({ productId, quantity: newQty, color: selectedColor, size: selectedSize });
        }
      }
    } else {
      setLocalQty(newQty);
    }
  };

  const handleAddToCart = () => {
    if (isInCart) {
      toast.info("ইতিমধ্যে এই ভ্যারিয়েন্টটি কার্টে যোগ করা হয়েছে।", {
        icon: <ShoppingCart className="size-4" />,
        duration: 1500,
      });
      return;
    }

    addToCart(
      { productId, quantity: localQty, color: selectedColor, size: selectedSize },
      {
        onSuccess: (data: { success?: boolean }) => {
          if (data?.success) {
            toast.success(`${productTitle} কার্টে যোগ করা হয়েছে!`, {
              icon: <ShoppingCart className="size-4" />,
              duration: 1500,
              action: {
                label: "চেকআউট",
                onClick: () => router.push("/cart"),
              },
            });
          }
        },
      },
    );
  };

  const handleBuyNow = () => {
    if (isInCart) {
      router.push("/checkout");
      return;
    }

    addToCart(
      { productId, quantity: localQty, color: selectedColor, size: selectedSize },
      {
        onSuccess: (data: { success?: boolean }) => {
          if (data?.success) {
            router.push("/checkout");
          }
        },
      },
    );
  };

  // Formatted Weight for UI
  const formattedWeight = product.weight
    ? product.weight < 1000
      ? `${product.weight} গ্রাম`
      : `${(product.weight / 1000).toFixed(2)} কেজি`
    : null;

  return (
    <div className="space-y-4">
      {/* Color Selection - Ant Design Tag/Button Style */}
      {product.colors && product.colors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              কালার: <span className="text-slate-900 dark:text-white font-bold font-sans capitalize">{selectedColor}</span>
            </p>
            {formattedWeight && (
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                ⚖️ {formattedWeight}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => {
              const isSelected = selectedColor === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={cn(
                    "h-8 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer",
                    isSelected
                      ? "bg-[#240303] text-white border border-[#240303] shadow-2xs"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-[#240303]/50 hover:text-[#240303]"
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection - Ant Design Tag/Button Style */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            সাইজ: <span className="text-slate-900 dark:text-white font-bold font-sans uppercase">{selectedSize}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const isSelected = selectedSize === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  className={cn(
                    "h-8 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer",
                    isSelected
                      ? "bg-[#240303] text-white border border-[#240303] shadow-2xs"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-[#240303]/50 hover:text-[#240303]"
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback Weight Badge if no colors */}
      {(!product.colors || product.colors.length === 0) && formattedWeight && (
        <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <span>ওজন:</span>
          <span className="text-slate-900 dark:text-white flex items-center gap-1 font-bold">⚖️ {formattedWeight}</span>
        </div>
      )}

      {/* Quantity & Stock Status - Ant Design Layout */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          পরিমাণ{" "}
          {isInCart && (
            <span className="text-[#240303] dark:text-[#E5B869] font-bold ml-1">
              (কার্টে ইতিমধ্যে যোগ করা আছে)
            </span>
          )}
        </p>
        <div className="flex items-center justify-between gap-4">
          <QuantitySelector
            quantity={displayQty}
            setQuantity={handleQtyChange}
            min={isInCart ? 0 : 1}
            max={stock}
          />
          <div>
            {stock > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-md">
                <span className="size-1.5 rounded-full bg-emerald-500"></span>
                {stock} পিস স্টকে আছে
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
                <span className="size-1.5 rounded-full bg-red-500"></span>
                স্টক শেষ
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons — 2 columns Row 1, Row 2 WhatsApp full width, Row 3 Call for Order full width */}
      <div className="flex flex-col gap-2.5 w-full pt-1">
        {/* Row 1: যোগ করুন & কিনুন */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <Button
            onClick={handleAddToCart}
            disabled={isDisabled}
            className={cn(
              "w-full h-11 rounded-lg text-xs sm:text-sm font-bold tracking-tight gap-2 transition-all active:scale-[0.98] cursor-pointer",
              isInCart
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed dark:bg-slate-800/50 dark:text-slate-500"
                : "bg-white dark:bg-slate-900 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-[#240303] hover:text-[#240303] shadow-2xs",
            )}
          >
            <ShoppingCart className="size-4 shrink-0 text-[#240303] dark:text-white" />
            {isInCart ? "যোগ করা হয়েছে" : "যোগ করুন"}
          </Button>

          <Button
            onClick={handleBuyNow}
            disabled={isDisabled}
            className="
              w-full h-11
              rounded-lg
              text-xs sm:text-sm font-bold tracking-tight
              gap-2
              bg-gradient-to-r from-[#1A0101] via-[#240303] to-[#1E0202]
              text-white
              hover:from-[#240303] hover:to-[#2D0505]
              border-none
              shadow-xs
              active:scale-[0.98]
              transition-all
              cursor-pointer
            "
          >
            <Zap className="size-4 text-amber-400 fill-amber-400 shrink-0" />
            {isInCart ? "চেকআউট" : "কিনুন"}
          </Button>
        </div>

        {/* Row 2: WhatsApp — Full Width */}
        <WhatsAppOrderButton
          product={product}
          quantity={displayQty}
          color={selectedColor}
          size={selectedSize}
        />

        {/* Row 3: Call for Order — Full Width */}
        <CallOrderButton
          phoneNumber="01568390014"
          displayNumber="01568-390014"
        />
      </div>

      {/* Separator + Trust Badges — mobile only */}
      <div className="md:hidden pt-2">
        <div className="flex flex-col rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center gap-3 px-3.5 py-2.5">
            <Truck className="size-4 text-[#240303] dark:text-[#E5B869] shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400">ডেলিভারি সুবিধা</p>
              <p className="text-xs font-bold text-slate-800 dark:text-white">২৪–৪৮ ঘণ্টার মধ্যে ডেলিভারি</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3.5 py-2.5 border-t border-slate-100 dark:border-slate-800">
            <RefreshCcw className="size-4 text-[#240303] dark:text-[#E5B869] shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400">রিটার্ন পলিসি</p>
              <p className="text-xs font-bold text-slate-800 dark:text-white">৭ দিনের মধ্যে সহজ রিটার্ন</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
