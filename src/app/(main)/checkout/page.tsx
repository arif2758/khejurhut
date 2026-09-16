// src/app/(main)/checkout/page.tsx
import { auth } from "@/auth";
import { cookies } from "next/headers";
import Cart from "@/models/Cart";
import Product from "@/models/Product"; // Fix MissingSchemaError
import { dbConnect } from "@/lib/db";
import { CheckoutForm } from "./CheckoutForm";
import { redirect } from "next/navigation";
import { ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

// Types
import { IPopulatedCartItem, ICart } from "@/types/cart";
import { Document } from "mongoose";

export const metadata: Metadata = {
  title: "চেকআউট | খেজুর হাট",
  description: "আপনার পছন্দের প্রিমিয়াম খেজুর ও পণ্য সরাসরি হাতে পেতে ডেলিভারি ঠিকানা দিন।",
};

// Helper type for Mongoose returned cart
type PopulatedCartDoc = Document &
  Omit<ICart, "items"> & { items: IPopulatedCartItem[] };

export default async function CheckoutPage() {
  await dbConnect();
  
  // Force Turbopack to keep the Product model import
  if (!Product) throw new Error("Product model missing");

  const session = await auth();
  const cookieStore = await cookies();
  const guestSessionId = cookieStore.get("cart_session_id")?.value;

  // ✅ Type safe cart fetching
  let cartDoc: PopulatedCartDoc | null = null;

  if (session?.user?.id) {
    cartDoc = (await Cart.findOne({ user: session.user.id })
      .populate("items.product")
      .lean()) as unknown as PopulatedCartDoc;
  } else if (guestSessionId) {
    cartDoc = (await Cart.findOne({ sessionId: guestSessionId })
      .populate("items.product")
      .lean()) as unknown as PopulatedCartDoc;
  }

  if (!cartDoc || !cartDoc.items || cartDoc.items.length === 0) {
    redirect("/cart");
  }

  // Calculate subtotal for safety
  const items: IPopulatedCartItem[] = cartDoc.items.map((item) => {
    const product = item.product;
    const price = product.salePrice || product.regularPrice;
    return {
      ...item,
      subtotal: price * item.itemQuantity,
    };
  });

  const total = items.reduce(
    (sum: number, item: IPopulatedCartItem) => sum + item.subtotal,
    0,
  );

  // Serialize for Client Component
  const serializableItems = JSON.parse(JSON.stringify(items));

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 pb-20 min-h-screen space-y-4 overflow-x-hidden min-w-0">
      {/* ── Breadcrumbs (Ant Design Style) ── */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
        <Link href="/" className="hover:text-[#240303] dark:hover:text-[#E5B869] transition-colors shrink-0">
          হোম
        </Link>
        <ChevronRight className="size-3 text-slate-400 shrink-0" />
        <Link href="/cart" className="hover:text-[#240303] dark:hover:text-[#E5B869] transition-colors shrink-0">
          কার্ট
        </Link>
        <ChevronRight className="size-3 text-slate-400 shrink-0" />
        <span className="text-slate-800 dark:text-slate-200 font-semibold truncate">
          চেকআউট
        </span>
      </nav>

      {/* ── Ant Design Page Header ── */}
      <div className="pb-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            চেকআউট
          </h1>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
            <CheckCircle2 className="size-3" /> নিরাপদ অর্ডার
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          আপনার অর্ডারটি নিশ্চিত করতে নিচের ডেলিভারি ঠিকানা ও পেমেন্ট তথ্য পূরণ করুন।
        </p>
      </div>

      <CheckoutForm
        cart={{ items: serializableItems, total }}
        user={{
          name: session?.user?.name || null,
          email: session?.user?.email || null,
        }}
      />
    </div>
  );
}
