"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import { formatRupiah } from "@/lib/utils";
import { copy } from "@/config/copy";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Trash2, ArrowRight, ShoppingBag, X } from "lucide-react";
import { useIsMounted } from "@/hooks/useIsMounted";

export const CartDrawer: React.FC = () => {
  const isMounted = useIsMounted();
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    subtotalIdr,
  } = useCartStore();

  // Trap escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDrawerOpen]);

  if (!isMounted) return null;

  const totalItemsCount = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-screen max-w-md bg-[var(--bg)] shadow-2xl flex flex-col justify-between border-l border-[var(--line)]"
            >
              {/* Header: Matches Lujo Living's cart-drawer__header */}
              <div className="px-6 py-5 border-b border-[var(--line)] flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-xl font-normal tracking-tight text-[var(--ink)]">
                    Keranjang Anda
                  </h2>
                  {totalItemsCount > 0 && (
                    <span className="text-xs font-mono text-[var(--ink-3)]">
                      ({totalItemsCount})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/cart"
                    onClick={closeDrawer}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--panel)] text-[11px] font-medium text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)] active:scale-95 transition-all shadow-2xs"
                  >
                    <span>Lihat Keranjang</span>
                    <ArrowRight size={11} />
                  </Link>

                  <button
                    type="button"
                    onClick={closeDrawer}
                    aria-label="Tutup keranjang"
                    className="p-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-full hover:bg-[var(--panel)] transition-colors cursor-pointer"
                  >
                    <X size={18} strokeWidth={1.8} />
                  </button>
                </div>
              </div>

              {/* Items List or Empty State */}
              <div className="flex-1 overflow-y-auto px-6 py-6 divide-y divide-[var(--line)]">
                {items.length === 0 ? (
                  <div className="py-4 space-y-8">
                    <div className="text-center py-6 space-y-2">
                      <p className="text-2xl font-light tracking-tight text-[var(--ink)]">
                        Keranjang masih kosong
                      </p>
                      <p className="text-xs text-[var(--ink-2)] max-w-xs mx-auto leading-relaxed">
                        Pilih komponen hardware, laptop, dan kebutuhan IT Anda dari katalog resmi GMC.
                      </p>
                    </div>

                    {/* Lujo-style "EXPLORE OUR COLLECTIONS" inside empty cart */}
                    <div className="border-t border-[var(--line)] pt-6 space-y-4">
                      <span className="micro-label text-[11px] text-[var(--ink-3)] block tracking-[0.08em]">
                        JELAJAHI KOLEKSI KAMI
                      </span>

                      <div className="grid grid-cols-2 gap-3">
                        {copy.categoryShowcase.slice(0, 4).map((cat) => (
                          <Link
                            key={cat.id}
                            href={cat.link}
                            onClick={closeDrawer}
                            className="group block bg-[var(--panel)] border border-[var(--line)] p-3 rounded-[2px] hover:border-[var(--ink)] transition-colors"
                          >
                            <div className="relative aspect-square w-full mb-2 bg-[var(--bg)] border border-[var(--line)]/50 overflow-hidden flex items-center justify-center">
                              <Image
                                src={cat.image.replace(".webp", ".svg")}
                                alt={cat.name}
                                fill
                                sizes="140px"
                                className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <p className="text-xs font-medium text-[var(--ink)] truncate">
                              {cat.name}
                            </p>
                            <span className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider block mt-0.5">
                              Lihat koleksi &rarr;
                            </span>
                          </Link>
                        ))}
                      </div>

                      <div className="pt-2 text-center">
                        <Link
                          href="/shop"
                          onClick={closeDrawer}
                          className="inline-flex items-center justify-center w-full py-3 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] micro-label text-xs tracking-widest hover:opacity-90 transition-opacity"
                        >
                          BELANJA SEMUA PRODUK
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                      {/* Thumbnail stage */}
                      <div className="relative w-20 h-20 bg-[var(--panel)] border border-[var(--line)] flex-shrink-0 flex items-center justify-center overflow-hidden rounded-[2px]">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-contain p-1.5"
                            sizes="80px"
                          />
                        ) : (
                          <span className="text-xs text-[var(--ink-3)] font-mono">GMC</span>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="micro-label text-[10px] text-[var(--ink-3)]">
                                {item.brand}
                              </span>
                              <h3 className="text-sm font-normal text-[var(--ink)] line-clamp-1">
                                {item.name}
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              aria-label={`Hapus ${item.name}`}
                              className="text-[var(--ink-3)] hover:text-[var(--danger)] transition-colors p-1 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          {item.variantName && (
                            <p className="text-xs text-[var(--ink-2)] mt-0.5">
                              {item.variantName}
                            </p>
                          )}
                        </div>

                        {/* Quantity Stepper and Price */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-[var(--line)] rounded-full bg-[var(--panel)]">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              aria-label="Kurangi kuantitas"
                              className="w-7 h-7 flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="w-8 text-center text-xs font-medium text-[var(--ink)]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              disabled={item.quantity >= item.maxStock}
                              aria-label="Tambah kuantitas"
                              className="w-7 h-7 flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] disabled:opacity-30 cursor-pointer"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                          <span className="text-sm font-medium text-[var(--ink)]">
                            {formatRupiah(item.priceIdr * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer */}
              {items.length > 0 && (
                <div className="p-6 border-t border-[var(--line)] bg-[var(--bg)] space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-base font-medium text-[var(--ink)]">
                      <span>Subtotal</span>
                      <span>{formatRupiah(subtotalIdr())}</span>
                    </div>
                    <p className="text-xs text-[var(--ink-3)]">
                      Pengiriman & pengambilan di ITC Mega Grosir dikonfirmasi saat checkout.
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <Link
                      href="/checkout"
                      onClick={closeDrawer}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] micro-label text-xs tracking-widest hover:opacity-90 active:scale-[0.99] transition-all shadow-md"
                    >
                      <span>LANJUT KE CHECKOUT</span>
                      <ArrowRight size={13} />
                    </Link>

                    <Link
                      href="/cart"
                      onClick={closeDrawer}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-[var(--line)] bg-[var(--panel)] text-xs font-medium uppercase tracking-wider text-[var(--ink)] hover:border-[var(--ink)] hover:bg-[var(--bg)] active:scale-[0.99] transition-all shadow-2xs"
                    >
                      <ShoppingBag size={13} />
                      <span>Buka Keranjang Lengkap</span>
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
