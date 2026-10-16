"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { copy } from "@/config/copy";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

export const CategoryShowcase: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const categories = copy.categoryShowcase;
  const activeCategory = categories[activeIndex];

  return (
    <section className="w-full bg-[var(--bg)] border-b border-[var(--line)] py-20 lg:py-28">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10">
        {/* Section Header */}
        <div className="mb-12 lg:mb-16">
          <span className="micro-label text-[var(--ink-3)] block mb-2">
            EKSPLORASI HARDWARE
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[var(--ink)]">
            Kategori Pilihan
          </h2>
        </div>

        {/* Desktop View: Left List + Right Large Image Stage */}
        <div className="hidden lg:grid grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Category List (5 cols) */}
          <div className="col-span-5 flex flex-col divide-y divide-[var(--line)]">
            {categories.map((cat, idx) => {
              const isActive = activeIndex === idx;
              return (
                <div
                  key={cat.id}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => setActiveIndex(idx)}
                  className="py-5 cursor-pointer group transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-2xl xl:text-3xl tracking-tight transition-all duration-300 ${
                        isActive
                          ? "text-[var(--ink)] font-normal translate-x-1"
                          : "text-[var(--ink-3)] font-light group-hover:text-[var(--ink)] group-hover:translate-x-0.5"
                      }`}
                    >
                      {cat.name}
                    </h3>
                    <span
                      className={`text-xs font-mono transition-all duration-300 ${
                        isActive
                          ? "text-[var(--ink)] opacity-100 font-semibold"
                          : "text-[var(--ink-3)] opacity-40 group-hover:opacity-80"
                      }`}
                    >
                      0{idx + 1}
                    </span>
                  </div>

                  {/* Smooth Accordion for Active Description & Link */}
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{
                          opacity: 1,
                          height: "auto",
                          marginTop: 12,
                          transition: {
                            height: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                            opacity: { duration: 0.35, delay: 0.08 },
                            marginTop: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                          },
                        }}
                        exit={{
                          opacity: 0,
                          height: 0,
                          marginTop: 0,
                          transition: {
                            opacity: { duration: 0.2 },
                            height: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                            marginTop: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                          },
                        }}
                        className="overflow-hidden space-y-3 pr-4"
                      >
                        <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                          {cat.desc}
                        </p>
                        <div>
                          <Link
                            href={cat.link}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--ink)] bg-[var(--bg)] text-xs font-medium uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--ink)] hover:text-white transition-all duration-200 active:scale-95 shadow-2xs group/btn"
                          >
                            <span>Lihat Koleksi</span>
                            <ArrowRight
                              size={13}
                              className="transition-transform duration-200 group-hover/btn:translate-x-0.5"
                            />
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Right Large Image Stage (7 cols) with concurrent crossfade */}
          <div className="col-span-7">
            <div className="relative aspect-[4/3] w-full bg-[var(--panel)] border border-[var(--line)] rounded-[2px] overflow-hidden p-8 flex items-center justify-center">
              <AnimatePresence initial={false}>
                <motion.div
                  key={activeCategory.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.03 }}
                  transition={{
                    opacity: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                    scale: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                  }}
                  className="absolute inset-8 flex items-center justify-center pointer-events-none"
                >
                  <Image
                    src={activeCategory.image.replace(".webp", ".svg")}
                    alt={activeCategory.name}
                    fill
                    sizes="(max-width: 1440px) 60vw, 800px"
                    className="object-contain p-4"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* Stage Category Watermark Badge */}
              <div className="absolute bottom-6 right-6 z-20">
                <span className="micro-label text-xs tracking-widest px-3 py-1 bg-[var(--bg)]/90 backdrop-blur-sm border border-[var(--line)] rounded-full text-[var(--ink-2)]">
                  {activeCategory.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile View: Vertical Stack of Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:hidden">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              href={cat.link}
              className="group block bg-[var(--panel)] border border-[var(--line)] p-6 rounded-[2px]"
            >
              <div className="relative aspect-[16/10] w-full mb-4 bg-[var(--bg)] border border-[var(--line)] overflow-hidden">
                <Image
                  src={cat.image.replace(".webp", ".svg")}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xl font-medium text-[var(--ink)]">{cat.name}</h3>
                <span className="text-xs font-mono text-[var(--ink-3)]">0{idx + 1}</span>
              </div>
              <p className="text-xs text-[var(--ink-2)] line-clamp-2 leading-relaxed mb-4">
                {cat.desc}
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--line)] bg-[var(--bg)] text-xs font-medium uppercase tracking-wider text-[var(--ink)] group-hover:border-[var(--ink)] group-hover:bg-[var(--ink)] group-hover:text-white transition-all duration-200 shadow-2xs">
                  <span>Lihat Koleksi</span>
                  <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
