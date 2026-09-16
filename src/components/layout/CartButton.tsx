// src/components/layout/CartButton.tsx
'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

export default function CartButton() {
  const { cartCount: count } = useCart()

  return (
    <Link
      href="/cart"
      aria-label={`Cart — ${count} item${count !== 1 ? 's' : ''}`}
      className="relative flex items-center justify-center size-9 rounded-full text-slate-700 dark:text-slate-200 hover:text-[#240303] dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
    >
      {/* Icon Wrapper so the badge sits precisely at the top-right outer corner of the cart icon */}
      <div className="relative flex items-center justify-center">
        <ShoppingCart className="size-5 stroke-[1.75] transition-colors" />

        {count > 0 && (
          <span
            className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold leading-none bg-[#9D1C20] text-white border-[1.5px] border-white dark:border-slate-900 shadow-2xs tabular-nums select-none pointer-events-none"
          >
            <span className="flex items-center justify-center leading-none">
              {count > 99 ? '99+' : count}
            </span>
          </span>
        )}
      </div>
    </Link>
  )
}