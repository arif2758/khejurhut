
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Bengali} from "next/font/google";
import "@/styles/globals.css";

import { Providers } from "@/components/providers/Providers";
import { ToastProvider } from "@/components/ui/toast-provider";

const notoSansfBengali = Noto_Sans_Bengali({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin", "bengali"],
  variable: "--font-noto-sans-bengali",
  display: "swap",
});


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_NAME = "খেজুর";
const APP_DEFAULT_TITLE =
  "খেজুর | খাঁটি ও প্রিমিয়াম খেজুরের বিশ্বস্ত শপ";
const APP_TITLE_TEMPLATE = "%s | খেজুর";
const APP_DESCRIPTION =
  "সৌদি আরব ও মদিনার ১০০% খাঁটি আজওয়া, মেদজুল, মরিয়ম, মাবরুম ও কালমি খেজুর কিনুন সেরা মূল্যে। রয়েছে দ্রুত হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি (COD) সুবিধা!";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "খেজুর",
    "khejur",
    "khejur shop bangladesh",
    "ajwa date",
    "medjool dates",
    "maryam date",
    "কালমি মরিয়ম খেজুর",
    "আজওয়া খেজুর",
    "মাবরুম খেজুর",
    "মেদজুল খেজুর",
    "অনলাইন খেজুর শপ",
  ],
  authors: [
    { name: "খেজুর", url: "https://khejur.com" },
  ],
  creator: "খেজুর",
  publisher: "খেজুর",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://khejur.com",
  ),

  alternates: {
    canonical: "/",
  },

  // Open Graph - Facebook, WhatsApp, LinkedIn, Discord
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    url: "/",
    images: [
      {
        url: "/og.png", 
        width: 1200,
        height: 630,
        alt: "খেজুর - প্রিমিয়াম খেজুরের বিশ্বস্ত শপ",
      },
    ],
    locale: "bn_BD",
  },

  // Twitter Card 
  twitter: {
    card: "summary_large_image",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    images: ["/og.png"],
  },

  // Icons - সব ডিভাইসের জন্য (Favicon & Apple Touch Icon)
  icons: {
    icon: [
      { url: "/favicon.png?v=2", type: "image/png" },
    ],
    apple: [
      { url: "/favicon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.png?v=2"],
  },

  // PWA + Mobile
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true, 
    statusBarStyle: "default",
    title: APP_NAME,
  },

  // AI/LLM friendly - Google, Perplexity, Claude যাতে বুঝে
  category: "shopping",
  classification: "E-commerce, Gadgets, Electronics, Bangladesh",

  // Verification - পরে Search Console থেকে কোড বসাবা
 verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_MERCHANT_CENTER_VERIFICATION,
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Viewport আলাদা এক্সপোর্ট - Next.js 16 রুল
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF6F0" },
    { media: "(prefers-color-scheme: dark)", color: "#120000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${notoSansfBengali.variable} ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <Providers>
          {children}
          <ToastProvider />
        </Providers>
         {process.env.NODE_ENV === "production" && (
           <>
             <Analytics />
             <SpeedInsights />
           </>
         )}
      </body>
    </html>
  );
}
