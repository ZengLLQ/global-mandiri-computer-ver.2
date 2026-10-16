import { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { ProductDetailClient } from "@/components/shop/ProductDetailClient";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await api.getProductBySlug(slug);
    const imageUrl = product.images.length > 0 ? product.images[0].url : "";
    return {
      title: `${product.name} | ${product.brand}`,
      description: product.description,
      openGraph: {
        title: `${product.name} - Global Mandiri Computer`,
        description: product.description,
        images: imageUrl ? [{ url: imageUrl }] : [],
      },
    };
  } catch {
    return {
      title: "Produk Hardware IT",
      description: "Detail produk komponen dan komputer di Global Mandiri Computer Surabaya",
    };
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;

  let product;
  try {
    product = await api.getProductBySlug(slug);
  } catch {
    notFound();
  }

  const primaryImage = product.images.length > 0 ? product.images[0].url : "";
  const minPrice = product.variants.length > 0 ? (product.variants[0].priceIdr ?? 0) : 0;

  // JSON-LD Product Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: primaryImage ? [`https://globalmandiricomputer.com${primaryImage}`] : [],
    description: product.description,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    offers: {
      "@type": "Offer",
      url: `https://globalmandiricomputer.com/shop/${product.slug}`,
      priceCurrency: "IDR",
      price: minPrice,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Global Mandiri Computer",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
