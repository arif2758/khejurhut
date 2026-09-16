"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface BannerSlide {
  id: string;
  image: string;
  alt: string;
  link: string;
  badge?: string;
}

const BANNERS: BannerSlide[] = [
  {
    id: "banner-1",
    image: "https://res.cloudinary.com/tanjumart/image/upload/v1789540911/banner1_pusxda.webp",
    alt: "প্রিমিয়াম খেজুরের সেরা সমাহার - খেজুর",
    link: "/products",
    badge: "Special Selection",
  },
  {
    id: "banner-2",
    image: "https://res.cloudinary.com/tanjumart/image/upload/v1789540912/banner2_bqqjhg.webp",
    alt: "আসল মদিনার প্রিমিয়াম তাজা খেজুর - খেজুর",
    link: "/products",
    badge: "Fresh Collection",
  },
];

export default function BannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
  }, []);

  // 🌟 Auto-crossfade every 5 seconds (pauses when hovering)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, isPaused]);

  return (
    <section className="w-full py-2 sm:py-3">
      <div
        className="w-full max-w-7xl mx-auto px-3 sm:px-4"
        style={{ maxWidth: "1280px" }}
      >
        <div
          className="relative group overflow-hidden w-full aspect-[16/9] rounded-xl sm:rounded-2xl bg-stone-950 shadow-md"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md shadow-lg border border-white/20 transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 flex items-center justify-center cursor-pointer"
          aria-label="Previous banner"
        >
          <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md shadow-lg border border-white/20 transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 flex items-center justify-center cursor-pointer"
          aria-label="Next banner"
        >
          <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
        </button>

        {/* 🌟 Crossfade Slides Stack (Fade transition instead of horizontal sliding) */}
        <div className="relative w-full h-full">
          {BANNERS.map((banner, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={banner.id}
                className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
                  isActive
                    ? "opacity-100 z-10 scale-100 pointer-events-auto"
                    : "opacity-0 z-0 scale-[1.015] pointer-events-none"
                }`}
                aria-hidden={!isActive}
              >
                <Link
                  href={banner.link}
                  className="block relative w-full h-full cursor-pointer group/link"
                  tabIndex={isActive ? 0 : -1}
                >
                  <Image
                    src={banner.image}
                    alt={banner.alt}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover/link:scale-[1.01]"
                  />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Indicators / Dots */}
        <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 md:gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-md">
          {BANNERS.map((banner, index) => (
            <button
              key={banner.id}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-1.5 md:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentIndex
                  ? "w-6 md:w-8 bg-amber-400 shadow-xs"
                  : "w-1.5 md:w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  </section>
  );
}
