"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  House,
  ShoppingBag,
  Tag,
  PackageSearch,
  PhoneCall,
  Search,
  Menu,
  X,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CartButton from "./CartButton";
import UserMenuButton from "./UserMenuButton";
import SearchDropdown from "./SearchDropdown";
import Image from "next/image";
import { WhatsAppIcon } from "@/socialCustomSVGIcon/SocialCustomSVGIcon";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: House },
  /*
   * [UI HIDE NOTE]:
   * বর্তমানে আমাদের স্টোরে মাত্র ৫টি প্রোডাক্ট রয়েছে এবং তা হোমপেইজেই সরাসরি সুন্দরভাবে প্রদর্শিত হচ্ছে।
   * তাই UI ক্লিন ও মিনিমালিস্টিক রাখতে আপাতত 'Products' ও 'Offers' অপশন দুটি মেন্যু থেকে কমেন্ট করে হাইড রাখা হয়েছে।
   * পরবর্তীতে যখন প্রোডাক্টের সংখ্যা বৃদ্ধি পাবে, তখন নিচের লাইন দুটি আনকমেন্ট করলেই মেন্যুতে আবার দেখা যাবে।
   * দ্রষ্টব্য: কোনো কোড বা রাউটিং মুছে ফেলা হয়নি। /products অথবা /products?sale=true রুটে সরাসরি ভিজিট করলে সব ঠিকঠাক কাজ করবে।
   */
  // { label: "Products", href: "/products", icon: ShoppingBag },
  // { label: "Offers", href: "/products?sale=true", icon: Tag },
  { label: "Track Order", href: "/track-order", icon: PackageSearch },
  { label: "Contact", href: "/contact", icon: PhoneCall },
];

// ✅ Desktop Nav Links
function NavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isActive = (href: string): boolean => {
    const [basePath, query] = href.split("?");
    if (basePath === "/") return pathname === "/";
    if (query) {
      const [key, value] = query.split("=");
      return pathname === basePath && searchParams.get(key) === value;
    }
    if (basePath === "/products") {
      const isOffersActive = searchParams.get("sale") === "true";
      if (isOffersActive) return false;
      return pathname.startsWith("/products");
    }
    return pathname.startsWith(basePath);
  };

  return (
    <div
      className="hidden lg:flex items-center gap-1"
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
              active
                ? "text-[#240303] dark:text-amber-400 bg-[#240303]/8 dark:bg-amber-400/10 border border-[#240303]/20 dark:border-amber-400/25 shadow-2xs font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-[#240303] dark:hover:text-amber-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 border border-transparent",
            )}
          >
            <Icon className="size-4" />
            <span>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

// ✅ Mobile Nav Links
function MobileNavLinks({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isActive = (href: string): boolean => {
    const [basePath, query] = href.split("?");
    if (basePath === "/") return pathname === "/";
    if (query) {
      const [key, value] = query.split("=");
      return pathname === basePath && searchParams.get(key) === value;
    }
    if (basePath === "/products") {
      const isOffersActive = searchParams.get("sale") === "true";
      if (isOffersActive) return false;
      return pathname.startsWith("/products");
    }
    return pathname.startsWith(basePath);
  };

  return (
    <nav
      className="max-w-7xl mx-auto px-4 py-3 space-y-1"
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              active
                ? "text-[#240303] dark:text-amber-400 bg-[#240303]/8 dark:bg-amber-400/10 border border-[#240303]/20 dark:border-amber-400/25 shadow-2xs font-bold"
                : "text-slate-700 dark:text-slate-300 hover:text-[#240303] dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800",
            )}
          >
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-lg transition-colors",
                active
                  ? "bg-[#240303]/12 text-[#240303] dark:bg-amber-400/15 dark:text-amber-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500",
              )}
            >
              <Icon className="size-4" />
            </div>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ✅ Route change হলে menu/search বন্ধ
function NavigationCloser({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onClose();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname, searchKey, onClose]);

  return null;
}

export default function NavbarClient() {
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // stable callback — route change এ সব বন্ধ
  const handleNavigationClose = useCallback(() => {
    setMobileOpen(false);
    setShowSearch(false);
  }, []);

  // Search toggle — mobile menu বন্ধ করে
  const handleSearchToggle = () => {
    setMobileOpen(false);
    setShowSearch((s) => !s);
  };

  // Mobile toggle — search বন্ধ করে
  const handleMobileToggle = () => {
    setShowSearch(false);
    setMobileOpen((o) => !o);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full pointer-events-none border-none">
        <div
          className="w-full max-w-7xl mx-auto px-0 sm:px-4 pointer-events-auto"
          style={{ maxWidth: "1280px" }}
        >
          <nav className="bg-white/98 dark:bg-slate-900/98 sm:rounded-b-2xl w-full h-14 border-none shadow-none">
            <div className="w-full h-full flex items-center justify-between px-3 sm:px-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 transition-transform hover:scale-105 active:scale-95 shrink-0"
            aria-label="খেজুর"
          >
            <div className="relative size-11 sm:size-12 rounded-full overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-700 shadow-xs bg-white flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="খেজুর" 
                width={512}
                height={512}
                priority
                className="size-full object-cover scale-110"
              />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight whitespace-nowrap bg-clip-text text-transparent bg-linear-to-r from-[#240303] via-[#9D1C20] to-[#240303] dark:from-amber-200 dark:via-amber-400 dark:to-amber-200">
              খেজুর
            </span>
          </Link>

          {/* Desktop Nav */}
          <Suspense
            fallback={
              <div className="hidden lg:flex items-center gap-1">
                {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground"
                  >
                    <Icon className="size-4" />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            }
            
          >
            <NavLinks />
          </Suspense>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/*
             * [UI HIDE NOTE]:
             * প্রোডাক্ট সংখ্যা কম (আপাতত ৫টি) হওয়ায় এবং সবগুলো প্রোডাক্ট হোমপেইজেই সহজে পাওয়া যাওয়ায়
             * UI থেকে সাময়িকভাবে সার্চ বাটনটি কমেন্ট করে হাইড রাখা হয়েছে।
             * পরবর্তীতে প্রোডাক্টের সংখ্যা বৃদ্ধি পেলে নিচের বাটনটি আনকমেন্ট করলেই সার্চ অপশনটি পুনরায় সক্রিয় হবে।
             */}
            {/*
            <button
              type="button"
              className="size-9 rounded-full flex items-center justify-center text-slate-700 hover:text-[#240303] hover:bg-slate-100 dark:text-slate-200 dark:hover:text-amber-400 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              onClick={handleSearchToggle}
              aria-label="Search"
              aria-expanded={showSearch}
              aria-controls="navbar-search-dropdown"
            >
              {showSearch ? (
                <X className="size-5 stroke-[1.75]" />
              ) : (
                <Search className="size-5 stroke-[1.75]" />
              )}
            </button>
            */}

            <CartButton />
            <UserMenuButton />

            <button
              type="button"
              className="size-9 lg:hidden rounded-full flex items-center justify-center text-slate-700 hover:text-[#240303] hover:bg-slate-100 dark:text-slate-200 dark:hover:text-amber-400 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              onClick={handleMobileToggle}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="size-5 stroke-[1.75]" />
              ) : (
                <Menu className="size-5 stroke-[1.75]" />
              )}
            </button>
          </div>
        </div>
      </nav>
    </div>
  </header>

      {/* Route change listener */}
      <Suspense fallback={null}>
        <NavigationCloser onClose={handleNavigationClose} />
      </Suspense>

      {/* Search Dropdown */}
      {showSearch && (
        <div
          id="navbar-search-dropdown"
          className="fixed top-14 left-0 right-0 z-60"
        >
          <SearchDropdown onClose={() => setShowSearch(false)} />
        </div>
      )}

      {/* Mobile Menu */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 top-14 z-45 bg-black/50 animate-in fade-in duration-200 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="fixed top-14 left-0 right-0 z-55 lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl animate-in slide-in-from-top-2 duration-200"
          >
            <Suspense
              fallback={
                <div className="p-4 text-sm text-muted-foreground">
                  লোডিং...
                </div>
              }
            >
              <MobileNavLinks onClose={() => setMobileOpen(false)} />
            </Suspense>
          </div>
        </>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-3">
        {/* WhatsApp */}
        <Link
          href="https://wa.me/8801568390014"
          target="_blank"
          rel="noopener noreferrer"
          className="flex size-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-[#20ba5a] group"
          aria-label="Chat on WhatsApp"
        >
          <WhatsAppIcon className="size-6 relative z-10 text-white" />
        </Link>

        {/* Scroll to Top */}
        {showScrollTop && (
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            size="icon"
            className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 animate-in fade-in slide-in-from-bottom-4"
            aria-label="Scroll to top"
          >
            <ChevronUp className="size-5" />
          </Button>
        )}
      </div>

      <div className="h-14" />
    </>
  );
}
