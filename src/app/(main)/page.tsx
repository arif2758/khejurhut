import { Suspense } from "react";
import Product from "@/models/Product";
import Category from "@/models/Category";
import HeroSection from "@/components/home/HeroSection";
import BannerCarousel from "@/components/home/BannerCarousel";
import ProductCard from "@/components/products/ProductCard";
import { IProduct } from "@/types/product";
import Footer from "@/components/layout/Footer";
import { dbConnect } from "@/lib/db";

export const revalidate = 60; // ISR চালু

async function getHomepageData() {
  await dbConnect();
  void Category; // Ensure Category schema is registered

  const [featured, allProducts] = await Promise.all([
    Product.find({ featured: true, status: "published" })
      .populate("category", "slug name")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    Product.find({ status: "published" })
      .populate("category", "slug name")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  /*
   * [UI UPDATE NOTE]:
   * বর্তমানে আমাদের স্টোরে প্রোডাক্ট সংখ্যা কম (আপাতত ৫টি)।
   * তাই ক্যাটেগরি বা ট্যাগ (Trending/Bestseller) অনুযায়ী আলাদা আলাদা ছোট ছোট গ্রিড না বানিয়ে
   * ক্যারোসেলের নিচে সরাসরি সকল প্রোডাক্টকে /products পেইজের মতো একটি সুবিন্যস্ত গ্রিডে দেখানো হচ্ছে।
   * ভবিষ্যতে যখন প্রোডাক্টের সংখ্যা বৃদ্ধি পাবে, তখন পূর্বের মতো ক্যাটেগরি অনুযায়ী গ্রিডগুলো সহজে পুনরায় সক্রিয় করা যাবে।
   */

  return {
    featuredProducts: JSON.parse(JSON.stringify(featured)) as IProduct[],
    allProducts: JSON.parse(JSON.stringify(allProducts)) as IProduct[],
  };
}

export default async function HomePage() {
  const { featuredProducts, allProducts } = await getHomepageData();

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* 1. Top Crossfade Banner */}
      <BannerCarousel />

      {/* 2. Featured Products Carousel */}
      <Suspense
        fallback={
          <div className="h-[40vh] animate-pulse bg-muted/50 rounded-xl m-4" />
        }
      >
        {featuredProducts.length > 0 && (
          <HeroSection featuredProducts={featuredProducts} />
        )}
      </Suspense>

      {/* 3. 🌟 All Products Section (যেমনটি /products পেজে দেখানো হয়েছিলো) */}
      <section className="max-w-7xl mx-auto px-4 mt-6 mb-12">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-1.5">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
            <span className="bg-clip-text text-transparent bg-linear-to-r from-[#240303] via-[#9D1C20] to-[#240303] dark:from-amber-200 dark:via-amber-400 dark:to-amber-200">
              সকল প্রিমিয়াম খেজুর
            </span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground font-medium">
            মদিনা ও সৌদি আরব থেকে সরাসরি আমদানিকৃত ১০০% খাঁটি খেজুরের কালেকশন
          </p>
        </div>

        {/* Product Cards Grid: Mobile 1 | Pad 2 | Laptop 3 | Desktop 4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 animate-in fade-in duration-700">
          {allProducts.map((product, index) => (
            <ProductCard
              key={product.slug}
              product={product}
              priority={index < 4}
            />
          ))}
        </div>
      </section>

      {/* 
        [UI BACKUP NOTE]:
        ভবিষ্যতে প্রোডাক্টের সংখ্যা অনেক বেশি হলে নিচের ট্যাগ এবং ডাইনামিক ক্যাটেগরি গ্রিড কোডটি আনকমেন্ট করতে পারেন:
        
        - Trending Grid (Product.find({ trending: true }))
        - Dynamic Category Grids (Category.find())
      */}

      <Footer />
    </div>
  );
}
