"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductDetail, Variant } from "@/types/api";
import { siteConfig } from "@/config/site";
import { formatRupiah } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { ProductCard } from "@/components/shop/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  MessageCircle,
  ChevronRight,
  ShieldCheck,
  Truck,
  ArrowDown,
  Wrench,
  Cpu,
  PackageCheck,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";

interface ProductDetailClientProps {
  product: ProductDetail;
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({ product }) => {
  const brandName = typeof product.brand === "object" && product.brand !== null ? (product.brand as any).name : String(product.brand || "");
  const categoryName = typeof product.category === "object" && product.category !== null ? (product.category as any).name : String(product.category || "");
  const categorySlug = typeof product.category === "object" && product.category !== null ? (product.category as any).slug || (product.category as any).name : String(product.category || "");
  const firstCrossSell = product.crossSells && product.crossSells.length > 0 ? product.crossSells[0] : null;

  const [selectedVariant, setSelectedVariant] = useState<Variant>(
    product.variants[0] || {
      id: product.id,
      sku: product.id,
      optionValues: {},
      priceIdr: 0,
      stock: 10,
      status: "ready",
    }
  );

  const [quantity, setQuantity] = useState(1);
  const [activeCenterTab, setActiveCenterTab] = useState<"PRODUK" | "SPESIFIKASI">("PRODUK");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [openAccordion, setOpenAccordion] = useState<string | null>("specs");
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Monitor scroll to trigger sticky top bar on desktop and bottom bar on mobile
  useEffect(() => {
    const handleScroll = () => {
      if (rightPanelRef.current) {
        const rect = rightPanelRef.current.getBoundingClientRect();
        if (rect.bottom < 80) {
          setShowStickyBar(true);
        } else {
          setShowStickyBar(false);
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleVariantSelect = (variant: Variant) => {
    setSelectedVariant(variant);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    const imageUrl =
      product.images.length > 0 ? product.images[0].url : `/products/${product.id}/1.svg`;

    let variantName = "";
    if (selectedVariant.optionValues) {
      variantName = Object.values(selectedVariant.optionValues).join(" / ");
    }

    addItem(
      {
        id: selectedVariant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        variantSku: selectedVariant.sku,
        variantName: variantName || "Standard",
        priceIdr: selectedVariant.priceIdr ?? selectedVariant.priceIDR ?? 0,
        compareAtPriceIdr: selectedVariant.compareAtPriceIdr ?? selectedVariant.compareAtPriceIDR,
        maxStock: selectedVariant.stock,
        imageUrl,
      },
      quantity
    );
  };

  const keySpecsEntries = Object.entries(product.specs || {}).slice(0, 5);

  // Prefilled WhatsApp message
  const currentPrice = selectedVariant.priceIdr ?? selectedVariant.priceIDR ?? 0;
  const currentCompare = selectedVariant.compareAtPriceIdr ?? selectedVariant.compareAtPriceIDR;
  const currentVariantLabel =
    Object.values(selectedVariant.optionValues || {}).join(" / ") || "Standard";

  const waMessage = encodeURIComponent(
    `Halo Admin GMC Surabaya, saya ingin menanyakan ketersediaan produk:\n\n*${product.name}*\nVarian: ${currentVariantLabel}\nHarga: ${formatRupiah(currentPrice)}\n\nLink: https://globalmandiricomputer.com/shop/${product.slug}`
  );
  const waUrl = `${siteConfig.contact.whatsappUrl}?text=${waMessage}`;

  return (
    <div className="w-full bg-[var(--bg)]">
      {/* Breadcrumb Bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-4 text-xs text-[var(--ink-3)] flex items-center gap-1.5 overflow-x-auto whitespace-nowrap border-b border-[var(--line)]">
        <Link href="/" className="hover:text-[var(--ink)] transition-colors">
          Beranda
        </Link>
        <ChevronRight size={12} />
        <Link href="/shop" className="hover:text-[var(--ink)] transition-colors">
          Shop
        </Link>
        <ChevronRight size={12} />
        <Link
          href={`/shop?category=${categorySlug}`}
          className="hover:text-[var(--ink)] uppercase transition-colors"
        >
          {categoryName}
        </Link>
        <ChevronRight size={12} />
        <span className="text-[var(--ink)] font-medium truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Product Layout: 3 Columns Desktop / Stack Mobile (Matches Lujo's product-page__grid) */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-8 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* COLUMN 1: LEFT (~3 cols on 12-col grid) */}
          <div className="lg:col-span-3 order-2 lg:order-1 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <span className="micro-label text-[var(--ink-3)] block tracking-[0.06em]">
                {brandName}
              </span>
              <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[var(--ink)] leading-snug">
                {product.name}
              </h1>

              {/* Price block */}
              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-2xl font-medium text-[var(--ink)]">
                  {formatRupiah(currentPrice)}
                </span>
                {currentCompare && currentCompare > currentPrice && (
                  <span className="text-sm text-[var(--ink-3)] line-through">
                    {formatRupiah(currentCompare)}
                  </span>
                )}
              </div>

              {/* Truncated Description with Read More / Read Less (Lujo signature) */}
              <div className="pt-2">
                <p
                  className={`text-sm text-[var(--ink-2)] leading-relaxed ${
                    isDescriptionExpanded ? "" : "line-clamp-4"
                  }`}
                >
                  {product.description}
                </p>
                {product.description.length > 140 && (
                  <button
                    type="button"
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="inline-flex items-center gap-1 text-xs text-[var(--ink)] font-medium mt-2 hover:opacity-75 transition-opacity cursor-pointer underline underline-offset-4"
                  >
                    <span>{isDescriptionExpanded ? "Ringkas Deskripsi" : "Baca Selengkapnya"}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      className={`transition-transform duration-200 ${
                        isDescriptionExpanded ? "-rotate-90" : "rotate-90"
                      }`}
                    >
                      <path d="M4.5 2.25L8.25 6L4.5 9.75" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Key Specs Bullets */}
            {keySpecsEntries.length > 0 && (
              <div className="border-t border-[var(--line)] pt-6 space-y-3">
                <span className="micro-label text-[var(--ink)] block mb-2 tracking-wider">
                  FITUR UTAMA
                </span>
                <ul className="space-y-2 text-xs text-[var(--ink-2)]">
                  {keySpecsEntries.map(([k, v]) => (
                    <li key={k} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink)] mt-1.5 flex-shrink-0" />
                      <span>
                        <strong className="text-[var(--ink)] font-medium">{k}:</strong> {v}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="pt-2">
                  <a
                    href="#spesifikasi-lengkap"
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--ink)] font-medium underline underline-offset-4 hover:opacity-75 transition-opacity"
                  >
                    <span>Lihat Spesifikasi Lengkap & Kompatibilitas</span>
                    <ArrowDown size={13} />
                  </a>
                </div>
              </div>
            )}

            {/* Cross-Sell Box: "Cocok dipadukan dengan" (Lujo's "Pairs well with") */}
            {firstCrossSell && (
              <div className="border border-[var(--line)] bg-[var(--panel)] p-4 rounded-[2px] space-y-3">
                <span className="micro-label text-[var(--ink)] block text-[10px] tracking-wider">
                  COCOK DIPADUKAN DENGAN
                </span>
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 bg-[var(--bg)] border border-[var(--line)] flex-shrink-0 overflow-hidden rounded-[2px]">
                    {firstCrossSell.primaryImageUrl ? (
                      <Image
                        src={firstCrossSell.primaryImageUrl}
                        alt={firstCrossSell.name}
                        fill
                        className="object-contain p-1"
                        sizes="56px"
                      />
                    ) : (
                      <span className="text-[10px] text-[var(--ink-3)] font-mono">GMC</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-normal text-[var(--ink)] truncate">
                      {firstCrossSell.name}
                    </p>
                    <p className="text-xs text-[var(--ink-2)] mt-0.5">
                      {formatRupiah(firstCrossSell.minPriceIdr ?? firstCrossSell.minPriceIDR ?? 0)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const csBrand = typeof firstCrossSell.brand === "object" && firstCrossSell.brand !== null
                        ? (firstCrossSell.brand as any).name
                        : String(firstCrossSell.brand || "");
                      addItem(
                        {
                          id: firstCrossSell.id,
                          productId: firstCrossSell.id,
                          slug: firstCrossSell.slug,
                          name: firstCrossSell.name,
                          brand: csBrand,
                          variantSku: firstCrossSell.id,
                          variantName: "Standard",
                          priceIdr: firstCrossSell.minPriceIdr ?? firstCrossSell.minPriceIDR ?? 0,
                          maxStock: 50,
                          imageUrl: firstCrossSell.primaryImageUrl,
                        },
                        1
                      );
                    }}
                    className="px-3 py-1.5 bg-[var(--btn)] text-[var(--btn-ink)] micro-label text-[10px] rounded-full hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                  >
                    TAMBAH
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* COLUMN 2: CENTER (~5 cols on 12-col grid) */}
          <div className="lg:col-span-5 order-1 lg:order-2 flex flex-col">
            {/* Center Stage Card (Matches Lujo's product-gallery) */}
            <div className="relative w-full aspect-square bg-[var(--panel)] border border-[var(--line)] rounded-[2px] overflow-hidden flex flex-col justify-between p-6 sm:p-8">
              {/* Top Left Tabs: PRODUK | SPESIFIKASI */}
              <div className="flex items-center gap-6 z-20">
                {(["PRODUK", "SPESIFIKASI"] as const).map((tab) => {
                  const isActive = activeCenterTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveCenterTab(tab)}
                      className={`relative micro-label text-xs tracking-widest pb-1 transition-colors cursor-pointer ${
                        isActive
                          ? "text-[var(--ink)] font-medium"
                          : "text-[var(--ink-3)] hover:text-[var(--ink)]"
                      }`}
                    >
                      <span>{tab}</span>
                      {isActive && (
                        <motion.div
                          layoutId="active-pdp-tab-line"
                          transition={{ type: "spring", stiffness: 450, damping: 38 }}
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--ink)]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Main Content Area in Stage with Crossfade */}
              <div className="relative flex-1 w-full my-4 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {activeCenterTab === "PRODUK" ? (
                    <motion.div
                      key={activeImageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="relative w-full h-full flex items-center justify-center"
                    >
                      {product.images[activeImageIndex] ? (
                        <Image
                          src={product.images[activeImageIndex].url}
                          alt={product.images[activeImageIndex].alt || product.name}
                          fill
                          priority
                          sizes="(max-width: 1024px) 100vw, 40vw"
                          className="object-contain p-4"
                        />
                      ) : (
                        <div className="text-sm text-[var(--ink-3)] font-mono">{brandName}</div>
                      )}
                    </motion.div>
                  ) : (
                    /* Second Tab: Spec Table */
                    <motion.div
                      key="spec-tab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="w-full h-full overflow-y-auto p-2"
                    >
                      <table className="w-full text-xs divide-y divide-[var(--line)]">
                        <tbody>
                          {Object.entries(product.specs || {}).map(([k, v]) => (
                            <tr key={k} className="py-2 flex justify-between gap-4">
                              <td className="font-medium text-[var(--ink)] py-1.5">{k}</td>
                              <td className="text-[var(--ink-2)] text-right py-1.5">{v}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Peek Carousel Progress Indicator */}
              {product.images.length > 1 && (
                <div className="flex items-center justify-center gap-2 z-20">
                  {product.images.map((img, idx) => (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      aria-label={`Lihat gambar ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        activeImageIndex === idx
                          ? "w-8 bg-[var(--ink)]"
                          : "w-2 bg-[var(--line)] hover:bg-[var(--ink-3)]"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
                {product.images.map((img, idx) => (
                  <button
                    key={img.url}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-16 bg-[var(--panel)] border rounded-[2px] flex-shrink-0 overflow-hidden cursor-pointer transition-colors ${
                      activeImageIndex === idx ? "border-[var(--ink)]" : "border-[var(--line)] opacity-70"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-contain p-1"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* COLUMN 3: RIGHT PANEL (~4 cols on 12-col grid, `--panel` background, matches Lujo's product-console) */}
          <div
            ref={rightPanelRef}
            className="lg:col-span-4 order-3 bg-[var(--panel)] border border-[var(--line)] p-6 sm:p-8 rounded-[2px] space-y-6"
          >
            {/* Variant Selectors */}
            {product.variants.length > 1 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="micro-label text-[var(--ink)] tracking-wider">
                    PILIH VARIAN
                  </span>
                  <span className="text-xs text-[var(--ink-2)]">
                    {currentVariantLabel}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant.id === v.id;
                    const label = Object.values(v.optionValues || {}).join(" / ") || v.sku;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleVariantSelect(v)}
                        className={`relative px-4 py-2 rounded-full text-xs font-medium tracking-tight transition-colors cursor-pointer border border-transparent ${
                          isSelected
                            ? "text-[var(--btn-ink)] shadow-2xs"
                            : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--ink)]"
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="active-pdp-variant"
                            transition={{ type: "spring", stiffness: 450, damping: 38 }}
                            className="absolute inset-0 bg-[var(--btn)] rounded-full -z-10 shadow-2xs"
                          />
                        )}
                        <span className="relative z-10">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock status indicator */}
            <div className="flex items-center justify-between text-xs py-2.5 border-y border-[var(--line)]">
              <span className="text-[var(--ink-2)]">Status Ketersediaan:</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-[var(--success)]">
                <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                <span>Ready Stock di ITC Mega Grosir</span>
              </span>
            </div>

            {/* Quantity Stepper (Pill Container) */}
            <div className="space-y-2">
              <span className="micro-label text-[var(--ink)] tracking-wider">
                KUANTITAS
              </span>
              <div className="flex items-center w-36 border border-[var(--line)] rounded-full bg-[var(--bg)]">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Kurangi kuantitas"
                  className="w-10 h-10 flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
                >
                  <Minus size={13} />
                </button>
                <motion.span
                  key={quantity}
                  initial={{ scale: 0.85, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.16 }}
                  className="flex-1 text-center text-sm font-medium text-[var(--ink)] tabular-nums"
                >
                  {quantity}
                </motion.span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                  disabled={quantity >= selectedVariant.stock}
                  aria-label="Tambah kuantitas"
                  className="w-10 h-10 flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] disabled:opacity-30 cursor-pointer"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Actions: Primary Black Pill + Secondary Outlined Pill */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full h-12 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] micro-label text-xs tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-md"
              >
                <ShoppingBag size={15} strokeWidth={2} />
                <span>TAMBAH KE KERANJANG</span>
              </button>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 rounded-full border border-[var(--ink)] text-[var(--ink)] micro-label text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-[var(--ink)] hover:text-[var(--btn-ink)] transition-colors cursor-pointer"
              >
                <MessageCircle size={15} />
                <span>TANYA VIA WHATSAPP</span>
              </a>
            </div>

            {/* Accordion: Specs, Garansi, Pengiriman with Lujo's animated + / - line morph */}
            <div className="border-t border-[var(--line)] pt-2 divide-y divide-[var(--line)]">
              {/* Accordion 1: Spesifikasi Lengkap */}
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === "specs" ? null : "specs")}
                  className="w-full py-2.5 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-[var(--ink)] text-left cursor-pointer group"
                >
                  <span>Spesifikasi Lengkap</span>
                  <div className="relative w-4 h-4 flex items-center justify-center text-[var(--ink)]">
                    {/* Horizontal line */}
                    <span className="absolute w-3.5 h-[1.5px] bg-current" />
                    {/* Vertical line morphs to 0 when open */}
                    <span
                      className={`absolute w-3.5 h-[1.5px] bg-current transition-transform duration-300 ${
                        openAccordion === "specs" ? "rotate-0 scale-0 opacity-0" : "rotate-90 scale-100 opacity-100"
                      }`}
                    />
                  </div>
                </button>
                <AnimatePresence>
                  {openAccordion === "specs" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pb-4 pt-2 text-xs text-[var(--ink-2)] space-y-1.5">
                        {Object.entries(product.specs || {}).map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-2 border-b border-[var(--line)]/50 pb-1">
                            <span className="text-[var(--ink)] font-medium">{k}</span>
                            <span className="text-right">{v}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion 2: Garansi Resmi */}
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === "warranty" ? null : "warranty")}
                  className="w-full py-2.5 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-[var(--ink)] text-left cursor-pointer group"
                >
                  <span>Garansi Resmi Brand</span>
                  <div className="relative w-4 h-4 flex items-center justify-center text-[var(--ink)]">
                    <span className="absolute w-3.5 h-[1.5px] bg-current" />
                    <span
                      className={`absolute w-3.5 h-[1.5px] bg-current transition-transform duration-300 ${
                        openAccordion === "warranty" ? "rotate-0 scale-0 opacity-0" : "rotate-90 scale-100 opacity-100"
                      }`}
                    />
                  </div>
                </button>
                <AnimatePresence>
                  {openAccordion === "warranty" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pb-4 pt-2 text-xs text-[var(--ink-2)] space-y-2 leading-relaxed">
                        <div className="flex items-start gap-2">
                          <ShieldCheck size={16} className="text-[var(--success)] flex-shrink-0 mt-0.5" />
                          <p>
                            Garansi 100% mengikuti ketentuan resmi distributor Indonesia (1 sampai 3 tahun atau lifetime sesuai brand). Kami bantu asistensi klaim garansi di counter toko ITC Mega Grosir Surabaya.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion 3: Pengiriman & Pengambilan */}
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === "delivery" ? null : "delivery")}
                  className="w-full py-2.5 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-[var(--ink)] text-left cursor-pointer group"
                >
                  <span>Pengiriman & Pengambilan</span>
                  <div className="relative w-4 h-4 flex items-center justify-center text-[var(--ink)]">
                    <span className="absolute w-3.5 h-[1.5px] bg-current" />
                    <span
                      className={`absolute w-3.5 h-[1.5px] bg-current transition-transform duration-300 ${
                        openAccordion === "delivery" ? "rotate-0 scale-0 opacity-0" : "rotate-90 scale-100 opacity-100"
                      }`}
                    />
                  </div>
                </button>
                <AnimatePresence>
                  {openAccordion === "delivery" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pb-4 pt-2 text-xs text-[var(--ink-2)] space-y-2 leading-relaxed">
                        <div className="flex items-start gap-2">
                          <Truck size={16} className="text-[var(--ink)] flex-shrink-0 mt-0.5" />
                          <p>
                            Bisa ambil langsung di ITC Mega Grosir Lt. 2 Blok B/7 Surabaya, kurir instan (Grab/Gojek area Surabaya), atau ekspedisi kargo packing kayu ke seluruh Indonesia.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* 4. DEDICATED FULL SPECIFICATIONS & HARDWARE OVERVIEW SECTION */}
        <section
          id="spesifikasi-lengkap"
          className="mt-16 sm:mt-24 pt-12 sm:pt-16 border-t border-[var(--line)] scroll-mt-24"
        >
          {/* Section Heading */}
          <div className="max-w-3xl mb-12 sm:mb-16">
            <span className="micro-label text-[var(--ink-3)] block mb-2 tracking-[0.1em]">
              IKHTISAR TEKNIS LENGKAP & DOKUMENTASI
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[var(--ink)]">
              Spesifikasi Lengkap
            </h2>
            <p className="text-sm sm:text-base text-[var(--ink-2)] mt-3 leading-relaxed">
              Seluruh parameter performa, kompatibilitas komponen, standar arsitektur, dan jaminan distributor resmi untuk <strong className="text-[var(--ink)] font-medium">{product.name}</strong>.
            </p>
          </div>

          {/* 4 Bento Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
            <div className="p-6 bg-[var(--panel)] border border-[var(--line)] rounded-[2px] flex flex-col justify-between">
              <div>
                <ShieldCheck size={22} className="text-[var(--ink)] mb-4" />
                <h3 className="text-sm font-medium text-[var(--ink)] tracking-tight mb-1.5">
                  Garansi Resmi Distributor
                </h3>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  100% Produk Original bergaransi resmi Indonesia. Dibantu klaim langsung di counter GMC ITC Mega Grosir Surabaya.
                </p>
              </div>
              <span className="micro-label text-[10px] text-[var(--success)] font-medium mt-4 block">
                TERJAMIN &bull; RESMI
              </span>
            </div>

            <div className="p-6 bg-[var(--panel)] border border-[var(--line)] rounded-[2px] flex flex-col justify-between">
              <div>
                <PackageCheck size={22} className="text-[var(--ink)] mb-4" />
                <h3 className="text-sm font-medium text-[var(--ink)] tracking-tight mb-1.5">
                  Brand New In Box (BNIB)
                </h3>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  Segel distributor resmi utuh, nomor seri terverifikasi, dan inspeksi fisik sebelum serah terima unit.
                </p>
              </div>
              <span className="micro-label text-[10px] text-[var(--ink-3)] font-medium mt-4 block">
                SEGEL ASLI &bull; SERIAL REGISTERED
              </span>
            </div>

            <div className="p-6 bg-[var(--panel)] border border-[var(--line)] rounded-[2px] flex flex-col justify-between">
              <div>
                <Wrench size={22} className="text-[var(--ink)] mb-4" />
                <h3 className="text-sm font-medium text-[var(--ink)] tracking-tight mb-1.5">
                  Uji Kompatibilitas Gratis
                </h3>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  Konsultasikan kecocokan soket prosesor, clearance cooler/RAM, dan form factor casing bersama teknisi kami.
                </p>
              </div>
              <span className="micro-label text-[10px] text-[var(--ink-3)] font-medium mt-4 block">
                KONSULTASI TEKNISI GMC
              </span>
            </div>

            <div className="p-6 bg-[var(--panel)] border border-[var(--line)] rounded-[2px] flex flex-col justify-between">
              <div>
                <Truck size={22} className="text-[var(--ink)] mb-4" />
                <h3 className="text-sm font-medium text-[var(--ink)] tracking-tight mb-1.5">
                  Pickup & Pengiriman Cepat
                </h3>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  Bisa diambil langsung di toko fisik ITC Mega Grosir Surabaya atau kirim instan hari ini (Surabaya & Sidoarjo).
                </p>
              </div>
              <span className="micro-label text-[10px] text-[var(--ink-3)] font-medium mt-4 block">
                ITC MEGA GROSIR LT. 2 B/7
              </span>
            </div>
          </div>

          {/* Full Technical Specs Table */}
          <div className="border border-[var(--line)] bg-[var(--bg)] rounded-[2px] overflow-hidden">
            <div className="bg-[var(--panel)] px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu size={18} className="text-[var(--ink)]" />
                <span className="text-xs uppercase tracking-widest font-medium text-[var(--ink)]">
                  TABEL SPESIFIKASI TEKNIS
                </span>
              </div>
              <span className="text-xs font-mono text-[var(--ink-3)]">
                SKU: {selectedVariant.sku || product.id}
              </span>
            </div>

            <div className="divide-y divide-[var(--line)]">
              {/* Product baseline attributes */}
              <div className="grid grid-cols-1 md:grid-cols-12 px-6 py-4 hover:bg-[var(--panel)]/40 transition-colors">
                <div className="md:col-span-4 text-xs font-medium uppercase tracking-wider text-[var(--ink)]">
                  Brand / Produsen
                </div>
                <div className="md:col-span-8 text-sm text-[var(--ink-2)] font-normal mt-1 md:mt-0">
                  {brandName}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 px-6 py-4 hover:bg-[var(--panel)]/40 transition-colors">
                <div className="md:col-span-4 text-xs font-medium uppercase tracking-wider text-[var(--ink)]">
                  Kategori Perangkat
                </div>
                <div className="md:col-span-8 text-sm text-[var(--ink-2)] font-normal mt-1 md:mt-0 uppercase">
                  {categoryName}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 px-6 py-4 hover:bg-[var(--panel)]/40 transition-colors">
                <div className="md:col-span-4 text-xs font-medium uppercase tracking-wider text-[var(--ink)]">
                  Varian & Opsi Dipilih
                </div>
                <div className="md:col-span-8 text-sm text-[var(--ink)] font-medium mt-1 md:mt-0">
                  {currentVariantLabel}
                </div>
              </div>

              {/* Dynamic specs entries from database / CSV */}
              {Object.entries(product.specs || {}).map(([key, value]) => (
                <div
                  key={key}
                  className="grid grid-cols-1 md:grid-cols-12 px-6 py-4 hover:bg-[var(--panel)]/40 transition-colors"
                >
                  <div className="md:col-span-4 text-xs font-medium uppercase tracking-wider text-[var(--ink)]">
                    {key}
                  </div>
                  <div className="md:col-span-8 text-sm text-[var(--ink-2)] leading-relaxed font-normal mt-1 md:mt-0">
                    {value}
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-1 md:grid-cols-12 px-6 py-4 hover:bg-[var(--panel)]/40 transition-colors">
                <div className="md:col-span-4 text-xs font-medium uppercase tracking-wider text-[var(--ink)]">
                  Kondisi Unit
                </div>
                <div className="md:col-span-8 text-sm text-[var(--ink-2)] font-normal mt-1 md:mt-0">
                  100% Baru, Segel Distributor Resmi Indonesia
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 px-6 py-4 hover:bg-[var(--panel)]/40 transition-colors">
                <div className="md:col-span-4 text-xs font-medium uppercase tracking-wider text-[var(--ink)]">
                  Pusat Layanan & Klaim
                </div>
                <div className="md:col-span-8 text-sm text-[var(--ink-2)] font-normal mt-1 md:mt-0">
                  Global Mandiri Computer &bull; ITC Mega Grosir Lt. 2 Blok B/7, Surabaya
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Consultation Banner */}
          <div className="mt-8 bg-[var(--panel)] border border-[var(--line)] rounded-[2px] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <span className="micro-label text-[var(--ink-3)] block tracking-wider">
                KONSULTASI HARDWARE & KOMPATIBILITAS
              </span>
              <h3 className="text-xl sm:text-2xl font-light text-[var(--ink)] tracking-tight">
                Ragu Apakah Komponen Ini Cocok dengan PC Anda?
              </h3>
              <p className="text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed">
                Kirimkan daftar spesifikasi motherboard, prosesor, atau casing Anda saat ini. Tim teknisi GMC siap membantu memverifikasi clearance dan kompatibilitas sebelum Anda membeli.
              </p>
            </div>

            <a
              href={`${siteConfig.contact.whatsappUrl}?text=${encodeURIComponent(
                `Halo Teknisi GMC, saya ingin konsultasi spesifikasi teknis dan kompatibilitas produk: *${product.name}* (SKU: ${selectedVariant.sku || product.id}).\n\nLink: https://globalmandiricomputer.com/shop/${product.slug}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] micro-label text-xs tracking-wider inline-flex items-center gap-2 hover:opacity-90 active:scale-98 transition-all shrink-0 cursor-pointer shadow-sm"
            >
              <MessageCircle size={16} />
              <span>TANYA TEKNISI VIA WHATSAPP</span>
            </a>
          </div>
        </section>

        {/* Related Products Carousel (Lujo's product-row) */}
        {product.crossSells && product.crossSells.length > 0 && (
          <div className="mt-20 pt-12 border-t border-[var(--line)]">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="micro-label text-[var(--ink-3)] block mb-1 tracking-wider">
                  REKOMENDASI LAINNYA
                </span>
                <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-[var(--ink)]">
                  Produk Terkait
                </h2>
              </div>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[var(--line)] bg-[var(--panel)] text-xs font-medium text-[var(--ink)] hover:border-[var(--ink)] active:scale-95 transition-all shadow-2xs group"
              >
                <span>Lihat Semua</span>
                <ArrowRight
                  size={13}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {product.crossSells.slice(0, 4).map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bar (Matches Lujo's product-atc-bar) */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 inset-x-0 z-40 bg-[var(--bg)]/95 backdrop-blur-md border-t border-[var(--line)] py-3 px-4 sm:px-8 shadow-lg"
          >
            <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
              {/* Product and Variant name */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-11 h-11 bg-[var(--panel)] border border-[var(--line)] rounded-[2px] overflow-hidden flex-shrink-0 hidden sm:block">
                  {product.images[0] && (
                    <Image
                      src={product.images[0].url}
                      alt={product.name}
                      fill
                      className="object-contain p-1"
                      sizes="44px"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-normal text-[var(--ink)] truncate">{product.name}</p>
                  <p className="text-xs text-[var(--ink-2)] truncate">
                    {currentVariantLabel}
                  </p>
                </div>
              </div>

              {/* Price & Add button */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="text-base font-medium text-[var(--ink)] hidden md:block">
                  {formatRupiah(currentPrice)}
                </span>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] micro-label text-xs tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md"
                >
                  <ShoppingBag size={14} strokeWidth={2} />
                  <span>TAMBAH KE KERANJANG &bull; {formatRupiah(currentPrice)}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
