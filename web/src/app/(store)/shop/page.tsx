import React from "react";
import { Metadata } from "next";
import { api } from "@/lib/api";
import { ShopClient } from "@/components/shop/ShopClient";
import { ShopSkeleton } from "@/components/shop/ShopSkeleton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop & Katalog Hardware IT",
  description:
    "Jelajahi komponen PC, laptop, monitor, VGA, motherboard, dan perlengkapan IT terlengkap di Global Mandiri Computer ITC Mega Grosir Surabaya.",
};

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    brand?: string;
    q?: string;
    min?: string;
    max?: string;
    inStock?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const resolvedParams = await searchParams;

  const minPrice = resolvedParams.min ? parseInt(resolvedParams.min, 10) : undefined;
  const maxPrice = resolvedParams.max ? parseInt(resolvedParams.max, 10) : undefined;
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;
  const inStock = resolvedParams.inStock === "true";

  // Parallel fetching from API
  const [categoriesRes, brandsRes, productsRes] = await Promise.allSettled([
    api.getCategories(),
    api.getBrands(),
    api.getProducts({
      category: resolvedParams.category,
      brand: resolvedParams.brand,
      q: resolvedParams.q,
      min: minPrice,
      max: maxPrice,
      inStock,
      sort: resolvedParams.sort,
      page,
      limit: 36,
    }),
  ]);

  const categories = categoriesRes.status === "fulfilled" ? categoriesRes.value : [];
  const brands = brandsRes.status === "fulfilled" ? brandsRes.value : [];
  const productData =
    productsRes.status === "fulfilled"
      ? productsRes.value
      : { items: [], total: 0, page: 1, totalPages: 1 };

  return (
    <React.Suspense fallback={<ShopSkeleton />}>
      <ShopClient
        initialProducts={productData.items}
        total={productData.total}
        categories={categories}
        brands={brands}
      />
    </React.Suspense>
  );
}
