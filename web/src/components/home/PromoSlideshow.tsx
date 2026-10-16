"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { copy } from "@/config/copy";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

export const PromoSlideshow: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const promos = copy.promos;
  const shouldReduceMotion = useReducedMotion();
  const SLIDE_DURATION = 8000;

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promos.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [promos.length, isPaused]);

  const activePromo = promos[currentSlide];

  return (
    <section className="w-full bg-[var(--bg)] border-b border-[var(--line)] py-12 lg:py-20 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10">
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative aspect-[16/9] md:aspect-[21/9] w-full bg-[var(--panel)] border border-[var(--line)] rounded-[2px] overflow-hidden group/stage shadow-sm"
        >
          {/* Progress Indicator Bar at the Top */}
          <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-[var(--line)]/50">
            <motion.div
              key={`${currentSlide}-${isPaused}`}
              initial={{ width: "0%" }}
              animate={{ width: isPaused ? undefined : "100%" }}
              transition={{
                duration: SLIDE_DURATION / 1000,
                ease: "linear",
              }}
              className="h-full bg-[var(--ink)]"
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 lg:p-16 select-none"
            >
              {/* Background Art with Gentle Ken Burns Zoom */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                <motion.div
                  initial={shouldReduceMotion ? { scale: 1 } : { scale: 1.06 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 8, ease: "easeOut" }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={activePromo.image.replace(".webp", ".svg")}
                    alt={activePromo.title}
                    fill
                    className="object-cover opacity-80"
                    sizes="100vw"
                    priority
                  />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)]/95 via-[var(--bg)]/55 to-transparent pointer-events-none" />
              </div>

              {/* Slide Content with Staggered Slide-Up */}
              <div className="relative z-10 max-w-xl space-y-4">
                <motion.span
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="micro-label text-[var(--ink-2)] tracking-widest block font-medium"
                >
                  {activePromo.label}
                </motion.span>

                <motion.h3
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[var(--ink)] leading-tight"
                >
                  {activePromo.title}
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  className="text-xs sm:text-sm text-[var(--ink-2)] line-clamp-2 leading-relaxed"
                >
                  {activePromo.desc}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
                  className="pt-2"
                >
                  <Link
                    href={activePromo.link}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] micro-label text-xs tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer group/btn"
                  >
                    <span>{activePromo.cta}</span>
                    <ArrowRight size={13} className="transition-transform duration-200 group-hover/btn:translate-x-1" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Slide Navigation & Pagination Bar */}
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
            {/* Slide Pagination Numbered Pills */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg)]/85 backdrop-blur-md border border-[var(--line)] shadow-2xs">
              {promos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Ke slide ${idx + 1}`}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono tracking-wider transition-all cursor-pointer ${
                    currentSlide === idx
                      ? "bg-[var(--ink)] text-[var(--btn-ink)] font-semibold shadow-2xs"
                      : "text-[var(--ink-3)] hover:text-[var(--ink)]"
                  }`}
                >
                  0{idx + 1}
                </button>
              ))}
            </div>

            {/* Prev / Next Chevrons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setCurrentSlide((prev) => (prev === 0 ? promos.length - 1 : prev - 1))
                }
                aria-label="Slide sebelumnya"
                className="w-10 h-10 rounded-full border border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur-md flex items-center justify-center text-[var(--ink)] hover:bg-[var(--bg)] active:scale-90 transition-all shadow-2xs cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => (prev + 1) % promos.length)}
                aria-label="Slide berikutnya"
                className="w-10 h-10 rounded-full border border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur-md flex items-center justify-center text-[var(--ink)] hover:bg-[var(--bg)] active:scale-90 transition-all shadow-2xs cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
