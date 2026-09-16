// src/components/product/CallOrderButton.tsx
"use client";

import { PhoneCall, ArrowRight } from "lucide-react";

interface CallOrderButtonProps {
  phoneNumber?: string;
  displayNumber?: string;
}

export function CallOrderButton({
  phoneNumber = "01568390014",
  displayNumber = "01568-390014",
}: CallOrderButtonProps) {
  return (
    <a
      href={`tel:${phoneNumber}`}
      className="flex w-full items-center justify-between h-11 px-4 rounded-lg bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white select-none transition-all duration-200 border border-blue-500/30 shadow-2xs group cursor-pointer active:scale-[0.99]"
      aria-label={`Call for order ${displayNumber}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="size-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <PhoneCall className="size-3.5 text-white animate-pulse" />
        </div>
        <span className="text-xs sm:text-sm font-bold tracking-tight">
          কল ফর অর্ডার
        </span>
      </div>

      <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider">
        <span>{displayNumber}</span>
        <ArrowRight className="size-3 opacity-80 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </a>
  );
}
