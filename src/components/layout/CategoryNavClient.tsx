// src/components/layout/CategoryNavClient.tsx
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CategoryNavItem } from "./CategoryNav";

interface CategoryNavClientProps {
  categories: CategoryNavItem[];
}

export function CategoryNavClient({ categories }: CategoryNavClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          if (currentScrollY < 120) {
            setIsVisible(true);
            setLastScrollY(currentScrollY);
            ticking = false;
            return;
          }

          const delta = Math.abs(currentScrollY - lastScrollY);
          if (delta < 10) {
            ticking = false;
            return;
          }

          if (currentScrollY > lastScrollY) {
            setIsVisible(false);
          } else {
            setIsVisible(true);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isScrolling) return;
    setShowLeft(el.scrollLeft > 10);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, [isScrolling]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const timer = setTimeout(checkScroll, 100);
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el || isScrolling) return;

    setIsScrolling(true);
    const scrollAmount = el.clientWidth * 0.7;
    const start = el.scrollLeft;
    const target =
      dir === "left"
        ? Math.max(0, start - scrollAmount)
        : Math.min(el.scrollWidth - el.clientWidth, start + scrollAmount);

    const duration = 300;
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      el.scrollLeft = start + (target - start) * easeProgress;

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        setIsScrolling(false);
        checkScroll();
      }
    };

    requestAnimationFrame(animateScroll);
  };

  const isActive = (slug: string) => pathname.startsWith(`/products/${slug}`);
  const isAllActive = pathname === "/products";

  const handleClick = (slug: string) => {
    router.push(`/products/${slug}`);
  };

  if (categories.length === 0) return null;

  // ✅ ফিক্স: Fragment দিয়ে wrap, spacer বাদ
  return (
    <div
      className={cn(
        "fixed top-14 left-0 right-0 z-40 overflow-hidden bg-white/98 dark:bg-slate-900/98 border-b border-slate-200/90 dark:border-slate-800 transition-transform duration-300 ease-in-out shadow-2xs",
        !isVisible && "-translate-y-full",
      )}
      aria-label="Category navigation"
    >
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-10 bg-linear-to-r from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />

      {showLeft && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("left")}
          disabled={isScrolling}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 p-0 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 shadow-md border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
          aria-label="Scroll categories left"
        >
          <ChevronLeft className="size-4 stroke-2" />
        </Button>
      )}

      <div
        ref={scrollRef}
        className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ scrollBehavior: "auto" }}
      >
        <div className="flex items-center gap-2 py-2.5 px-10">
          <button
            onClick={() => router.push("/products")}
            className={cn(
              "rounded-full px-4 text-xs h-8 transition-all duration-200 font-medium shrink-0 whitespace-nowrap cursor-pointer",
              isAllActive
                ? "bg-[#240303] text-white shadow-xs font-bold border-none"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-[#240303]/40 hover:text-[#240303]",
            )}
          >
            সব
          </button>

          {categories.map(({ name, slug }) => (
            <button
              key={slug}
              onClick={() => handleClick(slug)}
              className={cn(
                "rounded-full px-4 text-xs h-8 transition-all duration-200 font-medium shrink-0 whitespace-nowrap cursor-pointer",
                isActive(slug)
                  ? "bg-[#240303] text-white shadow-xs font-bold border-none"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-[#240303]/40 hover:text-[#240303]",
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-10 bg-linear-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />

      {showRight && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("right")}
          disabled={isScrolling}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 p-0 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 shadow-md border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
          aria-label="Scroll categories right"
        >
          <ChevronRight className="size-4 stroke-2" />
        </Button>
      )}
    </div>
  );
}
