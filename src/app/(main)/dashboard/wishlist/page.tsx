// src/app/(main)/dashboard/wishlist/page.tsx
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import Product from "@/models/Product";
import { redirect } from "next/navigation";
import { Heart, HeartCrack, ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/priceUtils";
import { IProduct } from "@/types/product";

export const metadata = {
  title: "পছন্দের তালিকা | খেজুর হাট | খেজুর",
  description: "আপনার পছন্দের সংরক্ষিত খেজুর ও পণ্যের তালিকা।",
};

async function getWishlistProducts(userId: string): Promise<IProduct[]> {
  await dbConnect();
  Product.init();

  const user = await User.findById(userId)
    .populate({
      path: "wishlist",
      model: Product,
    })
    .lean<{ wishlist: IProduct[] }>();

  return user?.wishlist ? JSON.parse(JSON.stringify(user.wishlist)) : [];
}

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/wishlist");
  }

  const wishlist = await getWishlistProducts(session.user.id);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#240303] dark:hover:text-[#E5B869] transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>ড্যাশবোর্ডে ফিরুন</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <Heart className="size-6 sm:size-7 text-rose-500 fill-rose-500" />
              পছন্দের তালিকা (Wishlist)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              আপনার পছন্দের সংরক্ষিত প্রিমিয়াম খেজুর ও আইটেমসমূহ।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              সংরক্ষিত পণ্য: {wishlist.length} টি
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      {wishlist.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {wishlist.map((item) => {
            const displayPrice = item.salePrice || item.regularPrice;
            const categorySlug =
              typeof item.category === "object" &&
              item.category !== null &&
              "slug" in item.category
                ? (item.category as { slug: string }).slug
                : "dates";
            const productHref = `/products/${categorySlug}/${item.slug}`;

            return (
              <div
                key={item._id as string}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs hover:border-[#240303]/40 dark:hover:border-[#E5B869]/40 hover:shadow-sm transition-all duration-200 group flex flex-col"
              >
                <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-800/40 p-3 overflow-hidden flex items-center justify-center">
                  <Link href={productHref} className="block relative w-full h-full">
                    <Image
                      src={item.thumbnail || "/logo.png"}
                      alt={item.title}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </Link>

                  <div className="absolute top-2.5 right-2.5">
                    <div className="size-8 bg-white/90 dark:bg-slate-900/90 rounded-full flex items-center justify-center shadow-2xs border border-slate-200 dark:border-slate-700 text-rose-500">
                      <Heart className="size-4 fill-rose-500" />
                    </div>
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <Link href={productHref}>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#240303] dark:group-hover:text-[#E5B869] transition-colors mb-2">
                      {item.title}
                    </h3>
                  </Link>

                  <div className="mt-auto pt-3 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-sm sm:text-base font-black text-[#240303] dark:text-[#E5B869]">
                      {formatPrice(displayPrice)}
                    </p>

                    <Link href={productHref}>
                      <button className="text-[11px] font-bold bg-[#240303] hover:bg-[#3a0808] text-white py-1.5 px-3 rounded-lg transition-colors cursor-pointer">
                        দেখুন
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="size-16 bg-rose-50 dark:bg-rose-950/40 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
            <HeartCrack className="size-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            আপনার পছন্দের তালিকা খালি
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
            আপনার পছন্দের খেজুর বা পণ্যগুলো সেভ করে রাখুন যাতে পরবর্তীতে সহজে খুঁজে পান।
          </p>
          <Link href="/products">
            <button className="bg-[#240303] hover:bg-[#3a0808] text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-lg shadow-xs transition-all cursor-pointer">
              পণ্য ব্রাউজ করুন
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
