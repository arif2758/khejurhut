"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: { url: string; alt: string }[];
}

export function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);

  if (!images.length) {
    return (
      <div className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200/80">
        <span className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">
          No Image
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* ── 1:1 Square Main Image ── */}
      <div className="w-full relative aspect-square rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs group">
        <Image
          src={images[activeImage].url}
          alt={images[activeImage].alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* ── Horizontal Thumbnail Strip (Below Main Image on Mobile & Desktop) ── */}
      {images.length > 1 && (
        <div className="flex flex-row gap-2.5 overflow-x-auto pb-1 shrink-0 custom-scrollbar">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImage(idx)}
              aria-label={`View image ${idx + 1}`}
              className={cn(
                "relative size-16 sm:size-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer",
                activeImage === idx
                  ? "border-[#240303] dark:border-amber-400 shadow-xs scale-[1.02]"
                  : "border-slate-200 dark:border-slate-700 hover:border-[#240303]/50 opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={img.url}
                alt={img.alt}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
