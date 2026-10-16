"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductCard as ProductCardType } from "@/types/api";
import { copy } from "@/config/copy";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Layers,
  Box,
  Laptop,
  Monitor,
  Cpu,
  Zap,
  Wifi,
} from "lucide-react";

interface FeaturedProductsProps {
  products: ProductCardType[];
}

const FILTER_TABS = [
  { id: "all", label: "Semua", icon: Layers },
  { id: "pc-rakitan", label: "PC Rakitan", icon: Box },
  { id: "laptop", label: "Laptop", icon: Laptop },
  { id: "monitor", label: "Monitor", icon: Monitor },
  { id: "processor", label: "Processor", icon: Cpu },
  { id: "gpu", label: "GPU", icon: Zap },
  { id: "networking", label: "Networking", icon: Wifi },
];

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ products }) => {
  const [activeTab, setActiveTab] = useState("all");

  const filteredProducts = useMemo(() => {
    if (activeTab === "all") {
      return products.slice(0, 12);
    }
    return products.filter((p) => p.category === activeTab).slice(0, 12);
  }, [products, activeTab]);

  return (
    <section className="w-full bg-[var(--bg)] border-b border-[var(--line)] py-20 lg:py-28">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10">
        {/* Header with Title and Real Pill Button Link */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <span className="micro-label text-[var(--ink-3)] block mb-2">
              SELEKSI TERBAIK GMC
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[var(--ink)]">
              {copy.featuredProducts.title}
            </h2>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--ink)] bg-[var(--bg)] text-xs font-medium uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--ink)] hover:text-white transition-all duration-200 active:scale-95 shadow-2xs group"
          >
            <span>{copy.featuredProducts.viewAll}</span>
            <ArrowRight
              size={13}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* Filter Chips Bar (Real Pill Buttons with Vector Icons) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium tracking-wider whitespace-nowrap transition-all duration-200 cursor-pointer active:scale-95 shadow-2xs ${
                  isActive
                    ? "bg-[var(--btn)] text-[var(--btn-ink)] shadow-xs"
                    : "border border-[var(--line)] bg-[var(--panel)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)]"
                }`}
              >
                <Icon size={13} className="shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Product Grid: 4 columns desktop / 2 mobile */}
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};
