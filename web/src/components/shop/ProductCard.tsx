"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductCard as ProductCardType } from "@/types/api";
import { formatRupiah } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { Heart, ShoppingBag, Check } from "lucide-react";

interface ProductCardProps {
  product: ProductCardType;
  priority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  priority = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const price = product.minPriceIdr ?? product.minPriceIDR ?? 0;
  const comparePrice = product.compareAtPriceIdr ?? product.compareAtPriceIDR;
  const brandName = typeof product.brand === "object" && product.brand !== null ? (product.brand as any).name : String(product.brand || "");
  const categoryName = typeof product.category === "object" && product.category !== null ? (product.category as any).name : String(product.category || "");

  const handleQuickAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    addItem(
      {
        id: product.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        brand: brandName,
        variantSku: product.id,
        variantName: "Standard",
        priceIdr: price,
        compareAtPriceIdr: comparePrice,
        maxStock: 99,
        imageUrl: product.primaryImageUrl,
      },
      1
    );

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const handleToggleWishlist = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col justify-between border-r border-b border-[var(--line)] bg-[var(--bg)] p-4 sm:p-5 lg:p-6 transition-colors duration-200 hover:bg-[var(--panel)]/40 h-full select-none"
    >
      {/* Top Header: NEW Tag & Real Wishlist Button */}
      <div className="flex items-center justify-between w-full h-6 z-10">
        {product.isFeatured ? (
          <span className="micro-label text-[10px] text-[var(--ink)] tracking-widest font-semibold px-2 py-0.5 rounded-full bg-[var(--panel)] border border-[var(--line)]/60">
            NEW
          </span>
        ) : (
          <span className="h-4" />
        )}

        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={isWishlisted ? "Hapus dari wishlist" : "Simpan ke wishlist"}
          className="w-8 h-8 rounded-full border border-[var(--line)]/60 bg-[var(--bg)] hover:border-[var(--ink)] hover:text-black flex items-center justify-center text-[var(--ink-3)] transition-all cursor-pointer shadow-2xs active:scale-90"
        >
          <Heart
            size={14}
            strokeWidth={1.5}
            className={isWishlisted ? "fill-[var(--ink)] text-[var(--ink)]" : ""}
          />
        </button>
      </div>

      {/* Center: Image Stage linking to PDP with lifestyle hover swap */}
      <div className="relative aspect-[4/3] sm:aspect-square w-full my-3 sm:my-5 flex items-center justify-center overflow-hidden">
        <Link
          href={`/shop/${product.slug}`}
          className="absolute inset-0 flex items-center justify-center cursor-pointer focus:outline-none"
          aria-label={`Lihat detail ${product.name}`}
        >
          {/* Primary product cutout image */}
          <div
            className={`absolute inset-0 transition-opacity duration-500 ease-out flex items-center justify-center ${
              isHovered && product.secondaryImageUrl ? "opacity-0" : "opacity-100"
            }`}
          >
            {product.primaryImageUrl ? (
              <Image
                src={product.primaryImageUrl}
                alt={product.name}
                fill
                priority={priority}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-contain p-2 group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-[var(--ink-3)] font-mono">
                {brandName}
              </div>
            )}
          </div>

          {/* Secondary / Lifestyle image on hover */}
          {product.secondaryImageUrl && (
            <div
              className={`absolute inset-0 transition-opacity duration-500 ease-out ${
                isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <Image
                src={product.secondaryImageUrl}
                alt={`${product.name} lifestyle`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover"
              />
            </div>
          )}
        </Link>

        {/* Real Quick Add To Cart Button (Prominent pill with ShoppingBag vector icon) */}
        <div className="absolute bottom-1 inset-x-1 z-20 transition-all duration-300 ease-out md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
          <button
            type="button"
            onClick={handleQuickAdd}
            aria-label={`Tambah ${product.name} ke keranjang`}
            className={`w-full h-9 px-3 rounded-full micro-label text-[10px] tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
              isAdded
                ? "bg-[var(--success)] text-white border border-[var(--success)]"
                : "bg-[var(--btn)] text-[var(--btn-ink)] hover:opacity-90 border border-transparent"
            }`}
          >
            {isAdded ? (
              <>
                <Check size={13} strokeWidth={2.5} />
                <span>DITAMBAHKAN</span>
              </>
            ) : (
              <>
                <ShoppingBag size={13} strokeWidth={2} />
                <span>TAMBAH KE KERANJANG</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Metadata */}
      <div className="pt-2 flex items-start justify-between gap-2.5 text-left">
        <div className="space-y-0.5 min-w-0 flex-1">
          {/* Title (Link to PDP) */}
          <Link
            href={`/shop/${product.slug}`}
            className="block focus:outline-none"
          >
            <h3 className="text-[13px] sm:text-[14px] font-normal text-[var(--ink)] leading-snug tracking-tight hover:underline underline-offset-2 line-clamp-1 transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Collection / Category */}
          <span className="micro-label text-[10px] text-[var(--ink-3)] block tracking-wider uppercase truncate">
            {categoryName} COLLECTION
          </span>

          {/* Source / Spec / Brand */}
          <span className="micro-label text-[9px] text-[var(--ink-3)] block tracking-wider uppercase truncate">
            BY {brandName} &bull; RESMI
          </span>

          {/* Variant color swatches */}
          <div className="flex items-center gap-1 pt-1.5">
            <span className="w-2.5 h-2.5 bg-[#111111] border border-[var(--line)] inline-block rounded-2xs" />
            <span className="w-2.5 h-2.5 bg-[#E8E4DC] border border-[var(--line)] inline-block rounded-2xs" />
            <span className="w-2.5 h-2.5 bg-[#8E8A82] border border-[var(--line)] inline-block rounded-2xs" />
            <span className="text-[9px] font-mono text-[var(--ink-3)] ml-0.5">+2</span>
          </div>
        </div>

        {/* Price on right */}
        <div className="text-right shrink-0">
          <span className="text-[13px] sm:text-[14px] font-medium text-[var(--ink)] tabular-nums">
            {formatRupiah(price)}
          </span>
          {comparePrice && comparePrice > price && (
            <span className="block text-[10px] text-[var(--ink-3)] line-through tabular-nums">
              {formatRupiah(comparePrice)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
