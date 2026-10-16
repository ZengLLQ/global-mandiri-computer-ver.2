"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/useCartStore";
import { formatRupiah } from "@/config/site";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, ShieldCheck, Store, MessageCircle } from "lucide-react";
import { useIsMounted } from "@/hooks/useIsMounted";

export const CartPageClient: React.FC = () => {
  const isMounted = useIsMounted();
  const {
    items,
    orderNote,
    setOrderNote,
    updateQuantity,
    removeItem,
    clearCart,
    subtotalIdr,
    totalCount,
  } = useCartStore();

  if (!isMounted) {
    return (
      <div className="min-h-[60vh] max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-pulse">
        <div className="h-10 w-48 bg-[#DAD6CC]/40 rounded-[2px] mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-6">
            <div className="h-28 bg-[#F2EFE8] rounded-[2px]" />
            <div className="h-28 bg-[#F2EFE8] rounded-[2px]" />
          </div>
          <div className="lg:col-span-4 h-64 bg-[#F2EFE8] rounded-[2px]" />
        </div>
      </div>
    );
  }

  const count = totalCount();
  const subtotal = subtotalIdr();

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-[#F2EFE8] border border-[#DAD6CC] flex items-center justify-center mb-6">
          <ShoppingBag className="w-8 h-8 text-[#5F5C55]" strokeWidth={1.5} />
        </div>
        <span className="micro-label text-[var(--ink-3)] mb-2 block tracking-widest">
          KERANJANG KOSONG
        </span>
        <h1 className="text-3xl sm:text-4xl font-light text-[#111111] tracking-tight mb-4 max-w-md">
          Belum ada produk di keranjang belanja Anda.
        </h1>
        <p className="text-[#5F5C55] text-base max-w-md mb-8">
          Temukan ragam komponen PC, laptop, monitor, dan networking original dengan garansi distributor resmi GMC.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-3 px-8 py-4 bg-[#000000] text-white rounded-full micro-label text-xs tracking-widest hover:bg-black/85 transition-colors cursor-pointer"
        >
          <span>Mulai Belanja</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 border-b border-[#DAD6CC] bg-[var(--bg)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumbs / Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#DAD6CC]">
          <div>
            <span className="micro-label text-[var(--ink-3)] block mb-1 tracking-widest">
              CHECKOUT PERSIAPAN
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-[#111111] tracking-tight">
              Keranjang Belanja
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-[#5F5C55]">
            <span className="tabular-nums">{count} item terpilih</span>
            <span className="text-[#DAD6CC]">&middot;</span>
            <button
              onClick={() => {
                if (window.confirm("Kosongkan semua produk dari keranjang?")) {
                  clearCart();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--panel)] text-xs text-[#B3261E] hover:border-[#B3261E] active:scale-95 transition-all cursor-pointer shadow-2xs font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Keranjang</span>
            </button>
          </div>
        </div>

        {/* Free Store Pickup Banner */}
        <div className="mt-6 p-4 rounded-[2px] bg-[#F2EFE8] border border-[#DAD6CC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm text-[#111111]">
            <Store className="w-5 h-5 text-[#2F6B3F] shrink-0" />
            <span>
              <strong>Ambil Langsung di Toko:</strong> Gratis biaya pengiriman dengan opsi ambil di ITC Mega Grosir Surabaya.
            </span>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--ink)] bg-[var(--bg)] text-xs uppercase tracking-wider font-medium text-[#111111] hover:bg-black hover:text-white transition-all duration-200 active:scale-95 shrink-0 shadow-2xs"
          >
            <span>+ Tambah Produk Lain</span>
          </Link>
        </div>

        {/* Main Grid: Items vs Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mt-10">
          {/* Items Column */}
          <div className="lg:col-span-8">
            <div className="divide-y divide-[#DAD6CC]">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      scale: 0.96,
                      overflow: "hidden",
                      paddingTop: 0,
                      paddingBottom: 0,
                      marginTop: 0,
                      marginBottom: 0,
                    }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="py-6 first:pt-0 flex flex-col sm:flex-row gap-5 sm:gap-6 items-start"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-[#F2EFE8] rounded-[2px] border border-[#DAD6CC] shrink-0 overflow-hidden">
                      <Image
                        src={item.imageUrl || "/products/cpu-r7-7800x3d/1.svg"}
                        alt={item.name}
                        fill
                        className="object-contain p-2"
                        sizes="112px"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="micro-label text-[10px] text-[#8B877E] block mb-1">
                            {item.brand}
                          </span>
                          <Link
                            href={`/shop/${item.productSlug || item.slug}`}
                            className="text-base sm:text-lg font-normal text-[#111111] hover:underline line-clamp-2 leading-snug"
                          >
                            {item.name}
                          </Link>
                          {item.variantName && item.variantName !== "Default" && (
                            <span className="inline-block mt-1 text-xs text-[#5F5C55] bg-[#F2EFE8] px-2.5 py-0.5 rounded-full border border-[#DAD6CC]">
                              Varian: {item.variantName}
                            </span>
                          )}
                          <span className="block text-xs font-mono text-[#8B877E] mt-1">
                            SKU: {item.variantSku}
                          </span>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[#8B877E] hover:text-[#B3261E] p-1.5 transition-colors cursor-pointer"
                          title="Hapus dari keranjang"
                          aria-label={`Hapus ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Stepper + Subtotal Row */}
                      <div className="mt-5 flex items-center justify-between gap-4">
                        {/* Quantity Stepper */}
                        <div className="inline-flex items-center h-9 border border-[#DAD6CC] rounded-full bg-white px-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-7 h-7 flex items-center justify-center text-[#5F5C55] hover:text-[#111111] disabled:opacity-30 cursor-pointer"
                            disabled={item.quantity <= 1}
                            aria-label="Kurangi jumlah"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <motion.span
                            key={item.quantity}
                            initial={{ scale: 0.85, opacity: 0.7 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.18 }}
                            className="w-8 text-center text-sm font-medium text-[#111111] tabular-nums inline-block"
                          >
                            {item.quantity}
                          </motion.span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 flex items-center justify-center text-[#5F5C55] hover:text-[#111111] disabled:opacity-30 cursor-pointer"
                            disabled={item.quantity >= item.maxStock}
                            aria-label="Tambah jumlah"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Line Price */}
                        <div className="text-right">
                          <div className="text-base sm:text-lg font-medium text-[#111111] tabular-nums">
                            {formatRupiah(item.priceIdr * item.quantity)}
                          </div>
                          {item.quantity > 1 && (
                            <span className="text-xs text-[#8B877E] tabular-nums">
                              @{formatRupiah(item.priceIdr)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Seller Note */}
            <div className="mt-8 pt-8 border-t border-[#DAD6CC]">
              <label
                htmlFor="order-note"
                className="micro-label text-[#111111] block mb-2"
              >
                CATATAN UNTUK PENJUAL (OPSIONAL)
              </label>
              <textarea
                id="order-note"
                rows={3}
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Contoh: Mohon bantu tes boot sebelum dikirim, atau request jadwal ambil hari Sabtu siang…"
                className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] p-3 text-sm text-[#111111] placeholder-[#8B877E] focus:outline-none focus:border-[#111111] transition-colors resize-none"
              />
              <p className="text-xs text-[#8B877E] mt-1.5">
                Catatan ini akan otomatis disertakan saat konfirmasi via WhatsApp dan cetak nota.
              </p>
            </div>
          </div>

          {/* Sticky Summary Column */}
          <div className="lg:col-span-4">
            <div className="bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] p-6 sm:p-8 sticky top-28">
              <h2 className="text-lg font-normal tracking-tight text-[#111111] pb-4 border-b border-[#DAD6CC]">
                Ringkasan Pesanan
              </h2>

              <div className="py-4 space-y-3 text-sm border-b border-[#DAD6CC]">
                <div className="flex justify-between text-[#5F5C55]">
                  <span>Total Produk ({count})</span>
                  <span className="text-[#111111] font-medium tabular-nums">{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#5F5C55]">
                  <span>Pengiriman</span>
                  <span className="text-[#2F6B3F] font-medium text-xs uppercase tracking-wider">
                    Dihitung di checkout
                  </span>
                </div>
                <div className="flex justify-between text-[#5F5C55]">
                  <span>Estimasi PPN</span>
                  <span className="text-xs text-[#8B877E]">Termasuk</span>
                </div>
              </div>

              <div className="py-4 flex justify-between items-baseline">
                <span className="text-base font-normal text-[#111111]">Total Perkiraan</span>
                <span className="text-2xl font-medium text-[#111111] tracking-tight tabular-nums">
                  {formatRupiah(subtotal)}
                </span>
              </div>

              {/* Checkout CTA */}
              <div className="mt-4 space-y-3">
                <Link
                  href="/checkout"
                  className="w-full h-12 bg-[#000000] text-white rounded-full flex items-center justify-center gap-2 micro-label text-xs tracking-widest hover:bg-black/85 active:scale-[0.99] transition-all cursor-pointer shadow-md"
                >
                  <span>LANJUT KE CHECKOUT</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/shop"
                  className="w-full h-11 border border-[#DAD6CC] bg-[var(--panel)] text-[#111111] rounded-full flex items-center justify-center gap-2 micro-label text-xs tracking-wider hover:border-[#111111] active:scale-[0.99] transition-all cursor-pointer shadow-2xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Lanjut Belanja</span>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-8 pt-6 border-t border-[#DAD6CC] space-y-3">
                <div className="flex items-center gap-3 text-xs text-[#5F5C55]">
                  <ShieldCheck className="w-4 h-4 text-[#2F6B3F] shrink-0" />
                  <span>Garansi Resmi Brand & 100% Produk Original</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#5F5C55]">
                  <Store className="w-4 h-4 text-[#111111] shrink-0" />
                  <span>Bisa Cek & Ambil di ITC Mega Grosir Surabaya</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#5F5C55]">
                  <MessageCircle className="w-4 h-4 text-[#2F6B3F] shrink-0" />
                  <span>Konfirmasi Cepat via WhatsApp Official</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
