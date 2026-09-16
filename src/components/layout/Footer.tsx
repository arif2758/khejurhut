// src\components\layout\Footer.tsx

import LinkNext from "next/link";
import Image from "next/image";
import {
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
  YouTubeIcon,
  TikTokIcon,
  DiscordIcon,
} from "@/socialCustomSVGIcon/SocialCustomSVGIcon";

const FOOTER_DATA = {
  shop: [
    { label: "সকল প্রোডাক্ট", href: "/products" },
    { label: "অফারসমূহ", href: "/products?sale=true" },
    { label: "নতুন কালেকশন", href: "/products?sort=newest" },
    { label: "বেস্টসেলার", href: "/products?sort=bestseller" },
  ],
  support: [
    { label: "অর্ডার ট্র্যাক করুন", href: "/track" },
    { label: "যোগাযোগ করুন", href: "/contact" },
    { label: "রিটার্ন পলিসি", href: "/return-policy" },
    { label: "ডেলিভারি চার্জ", href: "/shipping-info" },
  ],
  account: [
    { label: "আমার প্রোফাইল", href: "/dashboard" },
    { label: "অর্ডার হিস্টোরি", href: "/dashboard/my-orders" },
    { label: "উইশলিস্ট", href: "/wishlist" },
    { label: "লগইন", href: "/login" },
  ],
  socials: [
    {
      label: "Facebook",
      Icon: FacebookIcon,
      href: "https://www.facebook.com/gadgeterhub",
      brandColor: "#1877F2",
    },
    {
      label: "Instagram",
      Icon: InstagramIcon,
      href: "https://www.instagram.com/gadgeterhub/",
      brandColor: "#E4405F",
    },
    {
      label: "WhatsApp",
      Icon: WhatsAppIcon,
      href: "https://wa.me/8801568390014",
      brandColor: "#25D366",
    },
    {
      label: "Discord",
      Icon: DiscordIcon,
      href: "https://discord.gg/Fvyt5a4Y",
      brandColor: "#5865F2",
    },
    {
      label: "YouTube",
      Icon: YouTubeIcon,
      href: "https://www.youtube.com/@gadgeterhub",
      brandColor: "#FF0000",
    },
    
    {
      label: "TikTok",
      Icon: TikTokIcon,
      href: "https://www.tiktok.com/@gadgeterhub",
      brandColor: "#000000",
    },
  ],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-20 overflow-hidden">
      {/* 🌟 Background Decorative Glow */}
      <div className="absolute top-0 left-1/4 size-64 bg-[#9D1C20]/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand & Dynamic Socials */}
          <div className="col-span-2 lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <LinkNext href="/" className="flex items-center gap-2.5 group">
                <div className="relative size-12 sm:size-14 rounded-full overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-700 shadow-xs bg-[#FAF8F5] flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                  <Image
                    src="/logo.png"
                    alt="খেজুর"
                    fill
                    sizes="512px"
                    className="size-full object-cover scale-110"
                  />
                </div>
                <span className="text-2xl sm:text-3xl font-black tracking-tight whitespace-nowrap bg-clip-text text-transparent bg-linear-to-r from-[#240303] via-[#9D1C20] to-[#240303] dark:from-amber-200 dark:via-amber-400 dark:to-amber-200">
                  খেজুর
                </span>
              </LinkNext>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                সৌদি আরব ও মদিনার ১০০% খাঁটি ও প্রিমিয়াম খেজুরের নির্ভরযোগ্য গন্তব্য।
                আমরা দিচ্ছি অরিজিনাল কোয়ালিটির নিশ্চয়তা এবং দ্রুত ডেলিভারি।
              </p>
            </div>

            {/* Social Icons Container */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                Follow Us
              </h4>
              <div className="flex flex-wrap gap-2">
                {FOOTER_DATA.socials.map(
                  ({ label, Icon, href, brandColor }) => (
                    <LinkNext
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="group/icon flex size-10 items-center justify-center rounded-xl transition-all duration-500 shadow-sm relative overflow-hidden"
                      style={
                        {
                          "--brand-color": brandColor,
                        } as React.CSSProperties
                      }
                    >
                      {/* Background Layer */}
                      <div
                        className="absolute inset-0 opacity-10 md:opacity-0 md:group-hover/icon:opacity-100 transition-opacity duration-500"
                        style={{ backgroundColor: brandColor }}
                      />

                      {/* Icon */}
                      <div
                        className="relative z-10 transition-colors duration-500 md:group-hover/icon:text-white"
                        style={{
                          color: `var(--brand-color)`,
                        }}
                      >
                        <Icon className="size-5 md:group-hover/icon:text-white md:text-muted-foreground" />
                      </div>
                    </LinkNext>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Quick Links Group */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">
              Shop
            </h3>
            <ul className="space-y-3">
              {FOOTER_DATA.shop.map((link) => (
                <li key={link.href}>
                  <LinkNext
                    href={link.href}
                    className="text-[13px] text-muted-foreground hover:text-primary transition-all flex items-center gap-2 group"
                  >
                    <span className="size-1 rounded-full bg-primary scale-0 group-hover:scale-100 transition-transform" />
                    {link.label}
                  </LinkNext>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">
              Support
            </h3>
            <ul className="space-y-3">
              {FOOTER_DATA.support.map((link) => (
                <li key={link.href}>
                  <LinkNext
                    href={link.href}
                    className="text-[13px] text-muted-foreground hover:text-primary transition-all flex items-center gap-2 group"
                  >
                    <span className="size-1 rounded-full bg-primary scale-0 group-hover:scale-100 transition-transform" />
                    {link.label}
                  </LinkNext>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">
              Account
            </h3>
            <ul className="space-y-3">
              {FOOTER_DATA.account.map((link) => (
                <li key={link.href}>
                  <LinkNext
                    href={link.href}
                    className="text-[13px] text-muted-foreground hover:text-primary transition-all flex items-center gap-2 group"
                  >
                    <span className="size-1 rounded-full bg-primary scale-0 group-hover:scale-100 transition-transform" />
                    {link.label}
                  </LinkNext>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 💳 Trust Badges & Payment */}
        <div className=" mt-16 pt-8 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Payment Partners
            </p>
            <div className="flex items-center gap-5 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <div className="relative w-[45px] h-[25px]">
                <Image
                  src="/payment-method-logo/bkash.svg"
                  alt="bkash"
                  fill
                  className="object-contain"
                  sizes="45px"
                />
              </div>
              <div className="relative w-[45px] h-[25px]">
                <Image
                  src="/payment-method-logo/nagad.svg"
                  alt="nagad"
                  fill
                  className="object-contain"
                  sizes="45px"
                />
              </div>
              <div className="relative w-[45px] h-[25px]">
                <Image
                  src="/payment-method-logo/rocket.png"
                  alt="rocket"
                  fill
                  className="object-contain"
                  sizes="45px"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Certified Secure
              </p>
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-foreground/5 text-[9px] font-black border border-border/40">
                  SSL SECURED
                </span>
                <span className="px-2 py-1 rounded bg-foreground/5 text-[9px] font-black border border-border/40">
                  100% ORIGINAL
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className=" mt-12 pt-8 border-t border-border/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          <p className="text-center">
            © {new Date().toLocaleString("en-US", { year: "numeric" })}{" "}
            খেজুর. Developed with ❤️ in Bangladesh.
          </p>
          <div className="flex gap-12">
            <LinkNext
              href="/privacy"
              className="hover:text-primary transition-colors"
            >
              Privacy
            </LinkNext>
            <LinkNext
              href="/terms"
              className="hover:text-primary transition-colors"
            >
              Terms
            </LinkNext>
          </div>
        </div>
      </div>
    </footer>
  );
}
