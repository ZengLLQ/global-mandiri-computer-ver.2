import { Metadata } from "next";
import { api } from "@/lib/api";
import { siteConfig } from "@/config/site";
import { Hero } from "@/components/home/Hero";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { PromoSlideshow } from "@/components/home/PromoSlideshow";
import { WhyGmc } from "@/components/home/WhyGmc";
import { BrandMarquee } from "@/components/home/BrandMarquee";
import { VisitUs } from "@/components/home/VisitUs";

export const metadata: Metadata = {
  title: `${siteConfig.shortName} | ${siteConfig.name} - IT Hardware Store Surabaya`,
  description: siteConfig.description,
};

import { ProductCard } from "@/types/api";

export default async function HomePage() {
  let products: ProductCard[] = [];
  try {
    const res = await api.getProducts({ limit: 16 });
    products = res.items || [];
  } catch {
    products = [];
  }

  return (
    <div className="w-full flex flex-col">
      {/* 2. Hero */}
      <Hero />

      {/* 3. Category showcase */}
      <CategoryShowcase />

      {/* 4. Produk Pilihan grid */}
      <FeaturedProducts products={products} />

      {/* 5. Promo slideshows */}
      <PromoSlideshow />

      {/* 6. Kenapa GMC (5 pillars tabs + synced media) */}
      <WhyGmc />

      {/* 7. Brand marquee */}
      <BrandMarquee />

      {/* 8. Visit us */}
      <VisitUs />
    </div>
  );
}
