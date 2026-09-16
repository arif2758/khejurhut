// src\app\(main)\products\[category]\[slug]\page.tsx
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { formatPrice } from "@/lib/priceUtils";
import { notFound } from "next/navigation";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { ProductActions } from "@/components/product/ProductActions";
import { ProductTabs } from "@/components/product/ProductTabs";
import { Star, Truck, RefreshCcw, ChevronRight } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";

import type { IProduct, IProductSpecification } from "@/types/product";
import type { ICategory } from "@/types/category";
import Footer from "@/components/layout/Footer";
import { Metadata } from "next";
import { Types } from "mongoose";

export const revalidate = 3600;
export const dynamicParams = true;

type ProductWithCategorySlug = {
  slug: string;
  category?: {
    _id: Types.ObjectId;
    slug: string;
  } | null;
};

export async function generateStaticParams() {
  await dbConnect();
  void Category;
  const products = await Product.find({ status: "published" })
    .select("slug category")
    .populate("category", "slug")
    .lean<ProductWithCategorySlug[]>();

  return products
    .filter(
      (p): p is ProductWithCategorySlug & { category: { slug: string } } =>
        Boolean(p?.category && typeof p.category === "object" && p.category.slug),
    )
    .map((p) => ({
      category: p.category.slug,
      slug: p.slug,
    }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { slug, category } = await params;
  await dbConnect();
  const product = await Product.findOne({ slug }).lean<IProduct>();
  if (!product) return { title: "পণ্য পাওয়া যায়নি | খেজুর হাট" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://khejurhut.com";
  const productUrl = `${baseUrl}/products/${category}/${slug}`;

  return {
    title: `${product.seoTitle || product.title} | খেজুর হাট`,
    description: product.seoDesc || product.shortDesc,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: product.seoTitle || product.title,
      description: product.seoDesc || product.shortDesc,
      url: productUrl,
      siteName: "খেজুর হাট",
      images: [
        {
          url: product.thumbnail,
          width: 800,
          height: 800,
          alt: product.title,
        },
      ],
      type: "website",
    },
  };
}

type PopulatedProduct = Omit<IProduct, "category"> & {
  category: ICategory;
};

async function getProductData(slug: string) {
  await dbConnect();
  void Category;

  const productDoc = await Product.findOne({ slug, status: "published" })
    .populate("category", "name slug")
    .lean();

  if (!productDoc) return null;

  const product = productDoc as unknown as PopulatedProduct;

  const relatedProductsDocs = product.category
    ? await Product.find({
        category: product.category._id,
        _id: { $ne: product._id },
        status: "published",
      })
        .limit(4)
        .lean()
    : [];

  const relatedProducts = relatedProductsDocs as unknown as IProduct[];

  return {
    product: JSON.parse(JSON.stringify(product)) as PopulatedProduct,
    relatedProducts: JSON.parse(JSON.stringify(relatedProducts)) as IProduct[],
  };
}

export default async function ProductDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const params = await paramsPromise;
  const data = await getProductData(params.slug);

  if (!data) notFound();

  const { product, relatedProducts } = data;

  const displayPrice = product.salePrice || product.regularPrice;
  const formattedWeight = product.weight
    ? product.weight < 1000
      ? `${product.weight} গ্রাম`
      : `${(product.weight / 1000).toFixed(2)} কেজি`
    : null;

  const displaySpecs: IProductSpecification[] = [
    ...(product.specifications || []),
    ...(formattedWeight && !product.specifications?.some(s => s.key.toLowerCase() === "ওজন" || s.key.toLowerCase() === "weight")
      ? [{ key: "ওজন", value: formattedWeight }]
      : [])
  ];

  const hasFeatures = product.features && product.features.length > 0;
  const hasSpecs = displaySpecs.length > 0;

  // JSON-LD Generation
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://khejurhut.com";
  const productUrl = `${baseUrl}/products/${params.category}/${product.slug}`;
  
  const brandName = typeof product.brand === "object" && product.brand && "name" in product.brand 
    ? String((product.brand as Record<string, unknown>).name)
    : typeof product.brand === "string" && product.brand 
    ? product.brand 
    : "খেজুর হাট";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": [product.thumbnail, ...(product.images?.map(i => i.url) || [])],
    "description": product.shortDesc,
    "sku": product.sku,
    "brand": {
      "@type": "Brand",
      "name": brandName
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "BDT",
      "price": displayPrice,
      "availability": product.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "খেজুর হাট"
      }
    },
    ...(product.ratings?.count && product.ratings.count > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.ratings.average || 5,
        "reviewCount": product.ratings.count
      }
    } : {})
  };

  return (
    <div className="w-full overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 space-y-4 sm:space-y-5">
        {/* ==================== Breadcrumbs (Ant Design Style) ==================== */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
          <Link href="/" className="hover:text-[#240303] dark:hover:text-[#E5B869] transition-colors shrink-0">
            হোম
          </Link>
          <ChevronRight className="size-3 text-slate-400 shrink-0" />
          <Link href="/products" className="hover:text-[#240303] dark:hover:text-[#E5B869] transition-colors shrink-0">
            প্রোডাক্টস
          </Link>
          <ChevronRight className="size-3 text-slate-400 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200 font-semibold truncate">
            {product.category.name}
          </span>
        </nav>

        {/* ==================== Main Product Section ==================== */}
        <div className="w-full">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 md:items-start">
            {/* Left: Image Gallery & Desktop Trust Cards */}
            <div className="min-w-0 space-y-3">
              <ProductImageGallery images={product.images || []} />

              {/* Desktop Trust Cards */}
              <div className="hidden md:flex gap-3 pt-1">
                <div className="flex flex-1 items-center gap-3 px-3.5 py-2.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <Truck className="size-4 text-[#240303] dark:text-[#E5B869] shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400">ডেলিভারি সুবিধা</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">২৪–৪৮ ঘণ্টার মধ্যে</p>
                  </div>
                </div>
                <div className="flex flex-1 items-center gap-3 px-3.5 py-2.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <RefreshCcw className="size-4 text-[#240303] dark:text-[#E5B869] shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400">রিটার্ন পলিসি</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">৭ দিনের সহজ রিটার্ন</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Info & Actions */}
            <div className="space-y-4 min-w-0">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#fdf6f0] text-[#240303] dark:text-[#E5B869] text-[11px] font-bold rounded-md border border-[#240303]/15">
                    অফিশিয়াল
                  </span>

                  <div className="flex items-center gap-1 text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 px-2 py-0.5 rounded-md">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {product.ratings?.average || 4.8}
                    </span>
                    <span className="text-slate-400">
                      ({product.ratings?.count || 12})
                    </span>
                  </div>
                </div>

                <h1 className="text-lg sm:text-2xl font-bold leading-snug break-words text-slate-900 dark:text-white">
                  {product.title}
                </h1>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed break-words">
                  {product.shortDesc}
                </p>
              </div>

              {/* Pricing - Ant Design Stat Box */}
              <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3 py-2 border-y border-slate-100 dark:border-slate-800">
                <span className="text-2xl sm:text-3xl font-black text-[#240303] dark:text-[#f87171]">
                  {formatPrice(displayPrice)}
                </span>

                {product.salePrice && (
                  <span className="text-slate-400 text-xs sm:text-sm line-through">
                    {formatPrice(product.regularPrice)}
                  </span>
                )}

                {product.salePrice && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                    বাঁচবে {formatPrice(product.regularPrice - product.salePrice)}
                  </span>
                )}
              </div>

              {/* Actions & Variants */}
              <ProductActions
                productId={String(product._id)}
                productTitle={product.title}
                stock={product.stockQuantity}
                product={product}
              />
            </div>
          </div>
        </div>

        {/* ==================== Details, Specifications & Features (Ant Design Tabs) ==================== */}
        <ProductTabs
          description={product.description}
          specifications={displaySpecs}
          features={product.features}
          stockQuantity={product.stockQuantity}
        />

        {/* ==================== Related Products ==================== */}
        {relatedProducts.length > 0 && (
          <div className="space-y-3.5 pt-4 sm:pt-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                সম্পর্কিত পণ্যসমূহ (Related Products)
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.map((p: IProduct) => (
                <ProductCard key={String(p._id)} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}