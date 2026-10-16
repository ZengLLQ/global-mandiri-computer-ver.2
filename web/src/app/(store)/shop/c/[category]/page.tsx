import React from "react";
import { Metadata } from "next";
import { api } from "@/lib/api";
import { ShopClient } from "@/components/shop/ShopClient";
import { ShopSkeleton } from "@/components/shop/ShopSkeleton";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{
    brand?: string;
    q?: string;
    min?: string;
    max?: string;
    inStock?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const formattedName = category.replace(/-/g, " ").toUpperCase();
  return {
    title: `Katalog ${formattedName}`,
    description: `Koleksi lengkap ${formattedName} resmi bergaransi di Global Mandiri Computer ITC Mega Grosir Surabaya.`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params;
  const resolvedSearchParams = await searchParams;

  const minPrice = resolvedSearchParams.min ? parseInt(resolvedSearchParams.min, 10) : undefined;
  const maxPrice = resolvedSearchParams.max ? parseInt(resolvedSearchParams.max, 10) : undefined;
  const page = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page, 10) : 1;
  const inStock = resolvedSearchParams.inStock === "true";

  const [categoriesRes, brandsRes, productsRes] = await Promise.allSettled([
    api.getCategories(),
    api.getBrands(),
    api.getProducts({
      category,
      brand: resolvedSearchParams.brand,
      q: resolvedSearchParams.q,
      min: minPrice,
      max: maxPrice,
      inStock,
      sort: resolvedSearchParams.sort,
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
