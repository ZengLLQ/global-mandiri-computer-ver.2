"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductCard as ProductCardType } from "@/types/api";
import { formatRupiah } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { Heart, ArrowRight, ShieldCheck, Check, ShoppingBag, Eye } from "lucide-react";

interface ProductListItemProps {
  product: ProductCardType;
  priority?: boolean;
}

export const ProductListItem: React.FC<ProductListItemProps> = ({
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
      className="group relative bg-[var(--bg)] border border-[var(--line)] rounded-[2px] p-4 sm:p-6 transition-all duration-300 hover:border-[var(--ink)] hover:shadow-xs"
    >
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
        {/* Left: Product Image Stage with real Wishlist button */}
        <div className="relative w-full md:w-52 lg:w-64 aspect-square shrink-0 bg-[var(--panel)] border border-[var(--line)]/70 rounded-[2px] overflow-hidden flex items-center justify-center select-none">
          {/* Real Wishlist toggle button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label={isWishlisted ? "Hapus dari wishlist" : "Simpan ke wishlist"}
            className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full border border-[var(--line)]/60 bg-[var(--bg)]/90 hover:border-[var(--ink)] hover:text-black flex items-center justify-center text-[var(--ink-3)] transition-all cursor-pointer shadow-2xs active:scale-90"
          >
            <Heart
              size={14}
              strokeWidth={1.5}
              className={isWishlisted ? "fill-[var(--ink)] text-[var(--ink)]" : ""}
            />
          </button>

          <Link
            href={`/shop/${product.slug}`}
            className="absolute inset-0 flex items-center justify-center cursor-pointer focus:outline-none"
            aria-label={`Lihat detail ${product.name}`}
          >
            {/* Primary image */}
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
                  sizes="(max-width: 768px) 100vw, 256px"
                  className="object-contain p-4 group-hover:scale-[1.02] transition-transform duration-500 ease-out"
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
                  sizes="(max-width: 768px) 100vw, 256px"
                  className="object-cover"
                />
              </div>
            )}
          </Link>
        </div>

        {/* Center: Information & Metadata */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div>
            {/* Brand & Category micro-tags */}
            <div className="flex items-center gap-2 mb-2">
              <span className="micro-label text-[11px] text-[var(--ink-3)] font-medium">
                {brandName}
              </span>
              <span className="w-1 h-1 rounded-full bg-[var(--line)]" />
              <span className="micro-label text-[10px] text-[var(--ink-2)] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--panel)] border border-[var(--line)]/50">
                {categoryName}
              </span>
            </div>

            {/* Product Title */}
            <Link
              href={`/shop/${product.slug}`}
              className="block group/title focus:outline-none"
            >
              <h3 className="text-base sm:text-lg lg:text-xl font-normal text-[var(--ink)] tracking-tight group-hover/title:text-black leading-snug transition-colors">
                {product.name}
              </h3>
            </Link>

            {/* Stock status indicator */}
            <div className="flex items-center gap-2 mt-3 text-xs text-[var(--ink-2)]">
              <span className="w-2 h-2 rounded-full bg-[var(--success)] shrink-0 animate-pulse" />
              <span>Ready Stock &bull; ITC Mega Grosir Surabaya Lt. 2 Blok B/7</span>
            </div>

            {/* Warranty badge */}
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--ink-3)]">
              <ShieldCheck size={14} className="text-[var(--ink-2)] shrink-0" />
              <span>100% Original &bull; Garansi Resmi Distributor Indonesia</span>
            </div>
          </div>

          {/* Real Button / Pill for Viewing Details */}
          <div className="mt-4 pt-3 border-t border-[var(--line)]/60 flex items-center gap-3">
            <Link
              href={`/shop/${product.slug}`}
              className="px-4 py-2 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:border-[var(--ink)] hover:bg-[var(--panel)] text-xs uppercase tracking-wider font-medium text-[var(--ink)] inline-flex items-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Eye size={13} />
              <span>Lihat Spesifikasi & Detail</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Right: Price & Real Quick Action Button */}
        <div className="md:w-56 lg:w-64 shrink-0 flex flex-col md:items-end justify-between md:text-right pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-[var(--line)] md:pl-6">
          <div className="space-y-1">
            <span className="micro-label text-[10px] text-[var(--ink-3)] block md:text-right">
              HARGA RESMI
            </span>
            <div className="flex items-baseline md:justify-end gap-2">
              <span className="text-xl sm:text-2xl font-medium text-[var(--ink)] tabular-nums">
                {formatRupiah(price)}
              </span>
              {comparePrice && comparePrice > price && (
                <span className="text-xs text-[var(--ink-3)] line-through tabular-nums">
                  {formatRupiah(comparePrice)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--ink-3)]">Termasuk PPN &bull; Nota Resmi</p>
          </div>

          <div className="w-full mt-5">
            <button
              type="button"
              onClick={handleQuickAdd}
              aria-label={`Tambah ${product.name} ke keranjang`}
              className={`w-full h-11 px-5 rounded-full micro-label text-[11px] tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 ${
                isAdded
                  ? "bg-[var(--success)] text-white border border-[var(--success)]"
                  : "bg-[var(--btn)] text-[var(--btn-ink)] hover:opacity-90 border border-transparent"
              }`}
            >
              {isAdded ? (
                <>
                  <Check size={15} strokeWidth={2.5} />
                  <span>BERHASIL DITAMBAHKAN</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={15} strokeWidth={2} />
                  <span>+ KERANJANG</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
