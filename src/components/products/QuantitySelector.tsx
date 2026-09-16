"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  quantity: number; 
  setQuantity: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  className?: string;
  variant?: "default" | "compact" | "premium";
}
 
export default function QuantitySelector({
  quantity,
  setQuantity, 
  min,
  max, 
  step = 1,
  className,
  variant = "premium",
}: QuantitySelectorProps) {
  const handleDecrease = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (quantity > min) {
      const nextValue = Math.max(min, quantity - step);
      setQuantity(nextValue);
    }
  };

  const handleIncrease = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (quantity < max) {
      const nextValue = Math.min(max, quantity + step);
      setQuantity(nextValue);
    }
  };

  if (variant === "compact") {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <Button
          variant="outline"
          size="icon"
          className="size-7 rounded-full border-border/40 hover:bg-primary/10"
          onClick={handleDecrease}
          disabled={quantity <= min}
        >
          <Minus className="size-3" />
        </Button>
        <span className="text-sm font-bold min-w-[3ch] text-center">
          {quantity}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-7 rounded-full border-border/40 hover:bg-primary/10"
          onClick={handleIncrease}
          disabled={quantity >= max}
        >
          <Plus className="size-3" />
        </Button>
      </div>
    );
  }
 
  return (
    <div
      className={cn(
        "inline-flex items-center h-10 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 overflow-hidden shadow-2xs transition-all",
        className
      )}
    >
      <button
        type="button"
        onClick={handleDecrease}
        disabled={quantity <= min}
        aria-label="কমান"
        className="w-9 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 transition-colors border-r border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
      >
        <Minus className="size-3.5" />
      </button>

      <span className="w-12 text-center text-sm font-bold text-slate-900 dark:text-white tabular-nums select-none">
        {quantity}
      </span>

      <button
        type="button"
        onClick={handleIncrease}
        disabled={quantity >= max}
        aria-label="বাড়ান"
        className="w-9 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 transition-colors border-l border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
