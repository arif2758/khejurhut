// src/app/(main)/products/page.tsx
import { Suspense } from "react";
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { ProductsPageContent } from "@/components/products/ProductsPageContent";
import Footer from "@/components/layout/Footer";

import type { IProduct } from "@/types/product";
import type { ICategory } from "@/types/category";

export const revalidate = 3600;

async function getInitialData() {
  await dbConnect();

  const [productsDocs, categoriesDocs] = await Promise.all([
    Product.find({ status: "published" })
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    Category.find().lean<ICategory[]>(),
  ]);

  const products = JSON.parse(JSON.stringify(productsDocs)) as IProduct[];
  const categories = JSON.parse(JSON.stringify(categoriesDocs)) as ICategory[];

  return { products, categories };
}

export default async function ProductsPage() {
  const { products, categories } = await getInitialData();

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 py-4">
        <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
          <ProductsPageContent
            initialProducts={products}
            initialCategories={categories}
          />
        </Suspense>
      </section>
      <Footer />
    </>
  );
}
