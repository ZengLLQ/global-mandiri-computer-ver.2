"use client";

import React, { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductListItem } from "@/components/shop/ProductListItem";
import { ProductCard as ProductCardType, Category, Brand } from "@/types/api";
import { formatRupiah } from "@/config/site";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  LayoutGrid,
  Grid3X3,
  List,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  Layers,
  Cpu,
  CircuitBoard,
  MemoryStick,
  HardDrive,
  Box,
  Zap,
  Fan,
  Laptop,
  Monitor,
  Tv,
  Keyboard,
  Mouse,
  Wifi,
  Radio,
  Printer,
  Speaker,
} from "lucide-react";

export type ViewMode = "large" | "small" | "list";

interface ShopClientProps {
  initialProducts: ProductCardType[];
  total: number;
  categories: Category[];
  brands: Brand[];
}

function getCategoryIcon(categoryId: string) {
  const id = categoryId.toLowerCase();
  switch (id) {
    case "pc-rakitan":
      return <Box size={13} className="shrink-0" />;
    case "processor":
      return <Cpu size={13} className="shrink-0" />;
    case "motherboard":
      return <CircuitBoard size={13} className="shrink-0" />;
    case "gpu":
      return <Zap size={13} className="shrink-0" />;
    case "ram":
      return <MemoryStick size={13} className="shrink-0" />;
    case "ssd":
    case "hdd":
      return <HardDrive size={13} className="shrink-0" />;
    case "casing":
      return <Box size={13} className="shrink-0" />;
    case "psu":
    case "ups":
      return <Zap size={13} className="shrink-0" />;
    case "cooling":
    case "fan":
      return <Fan size={13} className="shrink-0" />;
    case "laptop":
      return <Laptop size={13} className="shrink-0" />;
    case "monitor":
      return <Monitor size={13} className="shrink-0" />;
    case "proyektor":
      return <Tv size={13} className="shrink-0" />;
    case "keyboard":
      return <Keyboard size={13} className="shrink-0" />;
    case "mouse":
      return <Mouse size={13} className="shrink-0" />;
    case "networking":
      return <Wifi size={13} className="shrink-0" />;
    case "starlink":
      return <Radio size={13} className="shrink-0" />;
    case "printer":
      return <Printer size={13} className="shrink-0" />;
    case "speaker":
      return <Speaker size={13} className="shrink-0" />;
    default:
      return <Cpu size={13} className="shrink-0" />;
  }
}

export const ShopClient: React.FC<ShopClientProps> = ({
  initialProducts,
  total,
  categories,
  brands,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // View mode: 'large' (2-3 cols), 'small' (3-4 cols), or 'list' (editorial full-width row)
  const [viewMode, setViewMode] = useState<ViewMode>("large");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Drag-to-scroll state for horizontal category bar
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!categoryScrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - categoryScrollRef.current.offsetLeft);
    setScrollLeft(categoryScrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !categoryScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoryScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    categoryScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Search input state
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [brandSearch, setBrandSearch] = useState("");

  // Price range inputs
  const [minPriceInput, setMinPriceInput] = useState(searchParams.get("min") || "");
  const [maxPriceInput, setMaxPriceInput] = useState(searchParams.get("max") || "");

  const activeCategory = searchParams.get("category") || "";
  const activeBrand = searchParams.get("brand") || "";
  const activeInStock = searchParams.get("inStock") === "true";
  const activeSort = searchParams.get("sort") || "latest";

  // URL Query sync
  const updateQueryParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`/shop?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams]
  );

  const setMultipleQueryParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      params.delete("page");
      startTransition(() => {
        router.push(`/shop?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams]
  );

  // Keyboard shortcut '/' to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        setIsFilterDrawerOpen(true);
        setTimeout(() => {
          document.getElementById("drawer-search-input")?.focus();
        }, 150);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter drawer body scroll lock & Escape key listener
  useEffect(() => {
    if (isFilterDrawerOpen) {
      document.body.style.overflow = "hidden";
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsFilterDrawerOpen(false);
        }
      };
      window.addEventListener("keydown", handleEscape);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isFilterDrawerOpen]);

  // Sync search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (searchParams.get("q") || "")) {
        updateQueryParam("q", searchInput);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, searchParams, updateQueryParam]);

  const clearAllFilters = () => {
    setSearchInput("");
    setMinPriceInput("");
    setMaxPriceInput("");
    router.push("/shop", { scroll: false });
  };

  const hasActiveFilters = Boolean(
    activeBrand ||
      activeInStock ||
      searchParams.get("min") ||
      searchParams.get("max") ||
      searchParams.get("q") ||
      activeSort !== "latest"
  );

  const activeCategoryObj = categories.find((c) => c.id === activeCategory);
  const pageTitle = activeCategoryObj ? activeCategoryObj.name : "Shop all";

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  return (
    <div className="w-full bg-[var(--bg)] min-h-screen">
      {/* 1. Collection Banner (Lujo-style Clean Headline & Narrative) */}
      <section className="w-full pt-10 sm:pt-14 pb-8 sm:pb-10 border-b border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[var(--ink)] mb-3 leading-tight">
            {pageTitle}
          </h1>
          <div className="max-w-xl text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed space-y-1">
            <p>
              Jelajahi seluruh koleksi komponen komputer, workstation rakitan, laptop, dan display premium di Global Mandiri Computer.
            </p>
            <p className="text-[var(--ink-3)]">
              100% Produk Original bergaransi resmi distributor Indonesia &bull; Siap uji performa di ITC Mega Grosir Surabaya.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Collection Sub-Nav (Lujo-style text links with sticky border-b) */}
      <nav
        aria-label="Filter kategori dan tampilan"
        className="sticky top-16 z-30 w-full bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--line)]"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-3 flex items-center justify-between gap-4">
          {/* Left: Horizontal Category Real Pill Buttons with Vector Icons */}
          <div
            ref={categoryScrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`flex-1 overflow-x-auto no-scrollbar scrollbar-none py-1 select-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <div className="flex items-center gap-2 min-w-max py-0.5">
              {/* "All" button */}
              <button
                type="button"
                onClick={() => updateQueryParam("category", null)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs tracking-wider transition-all duration-200 cursor-pointer active:scale-95 shadow-2xs ${
                  !activeCategory
                    ? "bg-black text-white border border-black font-medium shadow-xs"
                    : "bg-[var(--panel)] border border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)]"
                }`}
              >
                <Layers size={13} className="shrink-0" />
                <span className="font-mono text-[11px] uppercase">SEMUA</span>
              </button>

              {/* Categories */}
              {categories.map((cat) => {
                const isCatActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      updateQueryParam(
                        "category",
                        isCatActive ? null : cat.id
                      )
                    }
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs tracking-wider transition-all duration-200 cursor-pointer active:scale-95 shadow-2xs whitespace-nowrap ${
                      isCatActive
                        ? "bg-black text-white border border-black font-medium shadow-xs"
                        : "bg-[var(--panel)] border border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)]"
                    }`}
                  >
                    {getCategoryIcon(cat.id)}
                    <span className="font-mono text-[11px] uppercase">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Real FILTER button + segmented VIEW switcher */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 pl-4 border-l border-[var(--line)]">
            {/* Filter Trigger Button */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium tracking-wider transition-all duration-200 cursor-pointer active:scale-95 shadow-2xs ${
                hasActiveFilters
                  ? "bg-black text-white border-black shadow-xs"
                  : "bg-[var(--panel)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]"
              }`}
            >
              <SlidersHorizontal size={13} />
              <span className="text-[11px] font-mono uppercase">FILTER</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block" />
              )}
            </button>

            {/* View Switcher: Desktop Segmented Pills */}
            <div className="hidden sm:inline-flex items-center p-0.5 rounded-full border border-[var(--line)] bg-[var(--panel)] shadow-2xs">
              {/* Large View */}
              <button
                type="button"
                onClick={() => setViewMode("large")}
                aria-label="Tampilan Grid Besar"
                title="Grid Besar (3 Kolom)"
                className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                  viewMode === "large"
                    ? "bg-black text-white shadow-xs"
                    : "text-[var(--ink-3)] hover:text-[var(--ink)]"
                }`}
              >
                <LayoutGrid size={14} />
              </button>

              {/* Compact View */}
              <button
                type="button"
                onClick={() => setViewMode("small")}
                aria-label="Tampilan Grid Padat"
                title="Grid Padat (5 Kolom)"
                className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                  viewMode === "small"
                    ? "bg-black text-white shadow-xs"
                    : "text-[var(--ink-3)] hover:text-[var(--ink)]"
                }`}
              >
                <Grid3X3 size={14} />
              </button>

              {/* List View */}
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="Tampilan Daftar (List)"
                title="Tampilan Daftar"
                className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                  viewMode === "list"
                    ? "bg-black text-white shadow-xs"
                    : "text-[var(--ink-3)] hover:text-[var(--ink)]"
                }`}
              >
                <List size={14} />
              </button>
            </div>

            {/* Mobile View Toggle */}
            <div className="flex sm:hidden items-center">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === "list" ? "small" : "list")}
                aria-label="Ganti mode tampilan"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--line)] bg-[var(--panel)] text-[var(--ink-2)] hover:text-[var(--ink)] text-xs font-mono cursor-pointer active:scale-95 shadow-2xs"
              >
                {viewMode === "list" ? <LayoutGrid size={13} /> : <List size={13} />}
                <span className="text-[11px]">{viewMode === "list" ? "GRID" : "LIST"}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 3. Active Filters Pill Strip (If Any Active) */}
      {hasActiveFilters && (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-3 flex flex-wrap items-center gap-2 border-b border-[var(--line)]">
          <span className="text-xs text-[var(--ink-3)] font-medium mr-1">
            Filter diterapkan:
          </span>

          {activeBrand && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[var(--ink)] text-[var(--btn-ink)]">
              <span>Brand: {activeBrand}</span>
              <button
                type="button"
                onClick={() => updateQueryParam("brand", null)}
                className="hover:opacity-75 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {activeInStock && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[var(--ink)] text-[var(--btn-ink)]">
              <span>Ready Stock</span>
              <button
                type="button"
                onClick={() => updateQueryParam("inStock", null)}
                className="hover:opacity-75 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {searchParams.get("min") && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[var(--ink)] text-[var(--btn-ink)]">
              <span>Min: {formatRupiah(parseInt(searchParams.get("min")!, 10))}</span>
              <button
                type="button"
                onClick={() => updateQueryParam("min", null)}
                className="hover:opacity-75 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {searchParams.get("max") && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[var(--ink)] text-[var(--btn-ink)]">
              <span>Max: {formatRupiah(parseInt(searchParams.get("max")!, 10))}</span>
              <button
                type="button"
                onClick={() => updateQueryParam("max", null)}
                className="hover:opacity-75 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {searchParams.get("q") && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[var(--ink)] text-[var(--btn-ink)]">
              <span>Pencarian: &quot;{searchParams.get("q")}&quot;</span>
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  updateQueryParam("q", null);
                }}
                className="hover:opacity-75 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {activeSort !== "latest" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[var(--ink)] text-[var(--btn-ink)]">
              <span>
                Urutan:{" "}
                {activeSort === "price_asc"
                  ? "Harga Terendah"
                  : activeSort === "price_desc"
                  ? "Harga Tertinggi"
                  : "Nama A-Z"}
              </span>
              <button
                type="button"
                onClick={() => updateQueryParam("sort", null)}
                className="hover:opacity-75 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--panel)] text-xs font-medium text-[var(--ink-2)] hover:text-[#B3261E] hover:border-[#B3261E] transition-all cursor-pointer active:scale-95 ml-auto shadow-2xs"
          >
            <RotateCcw size={11} />
            <span>Hapus Semua Filter</span>
          </button>
        </div>
      )}

      {/* 4. Full-Width Seamless Collection Product Grid (Lujo Architectural Hairline Grid) */}
      <main className="w-full">
        {initialProducts.length === 0 ? (
          <div className="py-24 text-center max-w-[1440px] mx-auto px-4">
            <span className="micro-label text-[var(--ink-3)] block mb-2">
              TIDAK DITEMUKAN
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-[var(--ink)] mb-4">
              Tidak ada produk yang sesuai dengan kriteria filter.
            </h2>
            <p className="text-sm text-[var(--ink-2)] max-w-md mx-auto mb-8">
              Coba kurangi filter yang dipilih atau bersihkan pencarian untuk melihat seluruh koleksi hardware kami.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-8 py-3.5 bg-[#000000] text-white rounded-full text-xs uppercase tracking-widest font-medium hover:bg-black/85 transition-colors cursor-pointer"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : viewMode === "list" ? (
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-10 flex flex-col gap-4 sm:gap-6">
            {initialProducts.map((product, index) => (
              <ProductListItem
                key={product.id}
                product={product}
                priority={index < 4}
              />
            ))}
          </div>
        ) : (
          <div className="w-full border-b border-[var(--line)]">
            <div
              className={`w-full border-t border-l border-[var(--line)] transition-all duration-300 ${
                viewMode === "large"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              }`}
            >
              {initialProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 10}
                />
              ))}
            </div>
          </div>
        )}

        {/* 5. Lujo-Style Centered Pagination Strip with Real Pill Buttons */}
        {initialProducts.length > 0 && (
          <div className="w-full py-12 sm:py-16 flex items-center justify-center gap-2">
            {/* Prev button */}
            <button
              type="button"
              aria-label="Halaman sebelumnya"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-[var(--line)] bg-[var(--panel)] text-xs text-[var(--ink-2)] hover:border-[var(--ink)] hover:text-[var(--ink)] active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
              disabled
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:inline font-mono text-[11px] uppercase">Prev</span>
            </button>

            {/* Page 01 (Active pill) */}
            <button
              type="button"
              className="h-9 w-9 rounded-full bg-black text-white text-xs font-mono font-medium flex items-center justify-center shadow-xs cursor-default"
            >
              01
            </button>

            {/* Page 02 */}
            <button
              type="button"
              className="h-9 w-9 rounded-full border border-[var(--line)] bg-[var(--panel)] text-xs font-mono text-[var(--ink-2)] hover:border-[var(--ink)] hover:text-[var(--ink)] active:scale-95 transition-all cursor-pointer shadow-2xs flex items-center justify-center"
            >
              02
            </button>

            {/* Page 03 */}
            <button
              type="button"
              className="h-9 w-9 rounded-full border border-[var(--line)] bg-[var(--panel)] text-xs font-mono text-[var(--ink-2)] hover:border-[var(--ink)] hover:text-[var(--ink)] active:scale-95 transition-all cursor-pointer shadow-2xs flex items-center justify-center"
            >
              03
            </button>

            {/* Next button */}
            <button
              type="button"
              aria-label="Halaman berikutnya"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-[var(--line)] bg-[var(--panel)] text-xs text-[var(--ink-2)] hover:border-[var(--ink)] hover:text-[var(--ink)] active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              <span className="hidden sm:inline font-mono text-[11px] uppercase">Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </main>

      {/* 5. Slide-In Filter Drawer (Lujo-Style Right Popup) */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Drawer Container */}
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-screen max-w-md bg-[var(--bg)] border-l border-[var(--line)] shadow-2xl flex flex-col justify-between"
              >
                {/* Drawer Header */}
                <div className="px-6 py-5 border-b border-[var(--line)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-normal text-[var(--ink)] tracking-tight">
                      Filter & Urutkan
                    </h2>
                    <span className="text-xs font-mono text-[var(--ink-3)]">
                      ({total} produk)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFilterDrawerOpen(false)}
                    aria-label="Tutup filter"
                    className="p-2 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-full hover:bg-[var(--panel)] transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Drawer Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                  {/* Search Query Input */}
                  <div>
                    <label
                      htmlFor="drawer-search-input"
                      className="micro-label text-[var(--ink)] block mb-2"
                    >
                      CARI HARDWARE
                    </label>
                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)]"
                      />
                      <input
                        id="drawer-search-input"
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Contoh: RTX 4070, Core i7, OLED…"
                        className="w-full h-11 pl-10 pr-10 rounded-full border border-[var(--line)] bg-[var(--panel)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:border-[var(--ink)]"
                      />
                      {searchInput && (
                        <button
                          type="button"
                          onClick={() => setSearchInput("")}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)] hover:text-[var(--ink)]"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stock Availability Toggle */}
                  <div className="pt-4 border-t border-[var(--line)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-[var(--ink)] block">
                          Hanya Ready Stock
                        </span>
                        <span className="text-xs text-[var(--ink-3)]">
                          Tampilkan barang yang siap diambil di toko
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateQueryParam("inStock", activeInStock ? null : "true")
                        }
                        className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                          activeInStock ? "bg-black" : "bg-[#DAD6CC]"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out ${
                            activeInStock ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Sort Selection */}
                  <div className="pt-4 border-t border-[var(--line)]">
                    <span className="micro-label text-[var(--ink)] block mb-3">
                      URUTKAN BERDASARKAN
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "latest", label: "Terbaru" },
                        { id: "price_asc", label: "Harga Terendah" },
                        { id: "price_desc", label: "Harga Tertinggi" },
                        { id: "name_asc", label: "Nama A-Z" },
                      ].map((s) => {
                        const isSortActive = activeSort === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() =>
                              updateQueryParam("sort", s.id === "latest" ? null : s.id)
                            }
                            className={`py-2 px-3.5 text-xs rounded-full border text-left transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-between shadow-2xs ${
                              isSortActive
                                ? "bg-[#000000] text-white border-[#000000] shadow-xs"
                                : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink-2)] hover:border-[var(--ink)]"
                            }`}
                          >
                            <span>{s.label}</span>
                            {isSortActive && <Check size={12} strokeWidth={2.5} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="pt-4 border-t border-[var(--line)]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="micro-label text-[var(--ink)]">
                        KATEGORI PRODUK
                      </span>
                      {activeCategory && (
                        <button
                          type="button"
                          onClick={() => updateQueryParam("category", null)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[var(--line)] bg-[var(--panel)] text-[10px] font-mono text-[var(--ink-3)] hover:text-black hover:border-black transition-colors"
                        >
                          <RotateCcw size={10} />
                          <span>RESET</span>
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                      {categories.map((c) => {
                        const isCatActive = activeCategory === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() =>
                              updateQueryParam(
                                "category",
                                isCatActive ? null : c.id
                              )
                            }
                            className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs transition-all duration-200 cursor-pointer active:scale-95 shadow-2xs ${
                              isCatActive
                                ? "bg-black text-white shadow-xs"
                                : "border border-[var(--line)] bg-[var(--panel)] text-[var(--ink-2)] hover:border-black hover:text-[var(--ink)]"
                            }`}
                          >
                            {getCategoryIcon(c.id)}
                            <span>{c.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Brand Filter */}
                  <div className="pt-4 border-t border-[var(--line)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="micro-label text-[var(--ink)]">
                        MEREK / BRAND
                      </span>
                      {activeBrand && (
                        <button
                          type="button"
                          onClick={() => updateQueryParam("brand", null)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[var(--line)] bg-[var(--panel)] text-[10px] font-mono text-[var(--ink-3)] hover:text-black hover:border-black transition-colors"
                        >
                          <RotateCcw size={10} />
                          <span>RESET</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      placeholder="Cari brand (ASUS, MSI, GIGABYTE…)"
                      className="w-full h-9 px-3 mb-3 rounded-[2px] border border-[var(--line)] bg-[var(--panel)] text-xs text-[var(--ink)] focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
                      {filteredBrands.map((b) => {
                        const isBrandActive =
                          activeBrand.toLowerCase() === b.name.toLowerCase();
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() =>
                              updateQueryParam(
                                "brand",
                                isBrandActive ? null : b.name
                              )
                            }
                            className={`py-1 px-2.5 rounded-full text-[11px] font-mono transition-colors cursor-pointer ${
                              isBrandActive
                                ? "bg-black text-white"
                                : "border border-[var(--line)] bg-[var(--panel)] text-[var(--ink-2)] hover:border-black"
                            }`}
                          >
                            {b.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price Range Filter */}
                  <div className="pt-4 border-t border-[var(--line)]">
                    <span className="micro-label text-[var(--ink)] block mb-3">
                      RENTANG HARGA (RP)
                    </span>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <span className="text-[10px] uppercase text-[var(--ink-3)] block mb-1">
                          Minimum
                        </span>
                        <input
                          type="number"
                          value={minPriceInput}
                          onChange={(e) => setMinPriceInput(e.target.value)}
                          placeholder="0"
                          className="w-full h-9 px-3 rounded-[2px] border border-[var(--line)] bg-[var(--panel)] text-xs text-[var(--ink)] focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[var(--ink-3)] block mb-1">
                          Maksimum
                        </span>
                        <input
                          type="number"
                          value={maxPriceInput}
                          onChange={(e) => setMaxPriceInput(e.target.value)}
                          placeholder="50000000"
                          className="w-full h-9 px-3 rounded-[2px] border border-[var(--line)] bg-[var(--panel)] text-xs text-[var(--ink)] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "< 5 Jt", min: null, max: "5000000" },
                        { label: "5 - 15 Jt", min: "5000000", max: "15000000" },
                        { label: "15 - 30 Jt", min: "15000000", max: "30000000" },
                        { label: "> 30 Jt", min: "30000000", max: null },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setMinPriceInput(preset.min || "");
                            setMaxPriceInput(preset.max || "");
                            setMultipleQueryParams({
                              min: preset.min,
                              max: preset.max,
                            });
                          }}
                          className="px-2.5 py-1 text-[11px] rounded-full border border-[var(--line)] bg-[var(--panel)] hover:border-black text-[var(--ink-2)]"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="p-6 border-t border-[var(--line)] bg-[var(--bg)] flex items-center gap-3">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="flex-1 h-12 rounded-full border border-[var(--line)] bg-[var(--panel)] text-xs font-medium uppercase tracking-wider text-[var(--ink-2)] hover:border-black hover:text-black transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 shadow-2xs"
                  >
                    <RotateCcw size={13} />
                    <span>Reset</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMultipleQueryParams({
                        min: minPriceInput.trim() || null,
                        max: maxPriceInput.trim() || null,
                      });
                      setIsFilterDrawerOpen(false);
                    }}
                    className="flex-2 h-12 rounded-full bg-[#000000] text-white text-xs font-medium uppercase tracking-widest hover:bg-black/85 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 shadow-md"
                  >
                    <Check size={14} strokeWidth={2.5} />
                    <span>Tampilkan ({total})</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
