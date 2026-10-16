"use client";

import React, { useState } from "react";
import Link from "next/link";
import { copy } from "@/config/copy";
import { siteConfig } from "@/config/site";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight, ArrowRight, ChevronDown } from "lucide-react";

export const Hero: React.FC = () => {
  const headlineLines = ["Rakit.", "Upgrade.", "Terhubung."];

  // Mouse move parallax on hero background
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const bgTranslateX = useTransform(smoothX, [-0.5, 0.5], [-20, 20]);
  const bgTranslateY = useTransform(smoothY, [-0.5, 0.5], [-20, 20]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight - 80,
      behavior: "smooth",
    });
  };

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-[calc(100vh-80px)] flex flex-col justify-end overflow-hidden bg-[var(--bg)] border-b border-[var(--line)]"
    >
      {/* Background Media with Ken Burns Slow Scale and Interactive Parallax */}
      <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
        <motion.div
          style={{ x: bgTranslateX, y: bgTranslateY }}
          animate={{ scale: [1, 1.05] }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          className="relative w-full h-full"
        >
          {/* Subtle architectural schematic SVG on warm cream stage */}
          <svg
            className="w-full h-full object-cover opacity-60"
            viewBox="0 0 1920 1080"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="1920" height="1080" fill="#FBF7EF" />
            <circle cx="960" cy="540" r="420" stroke="#DAD6CC" strokeWidth="1" strokeDasharray="4 8" />
            <circle cx="960" cy="540" r="280" stroke="#DAD6CC" strokeWidth="1" />
            <circle cx="960" cy="540" r="140" stroke="#DAD6CC" strokeWidth="1" />
            <line x1="960" y1="0" x2="960" y2="1080" stroke="#DAD6CC" strokeWidth="1" />
            <line x1="0" y1="540" x2="1920" y2="540" stroke="#DAD6CC" strokeWidth="1" />
            <circle cx="960" cy="540" r="6" fill="#111111" />
          </svg>
        </motion.div>

        {/* Gradient mask for high text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/75 to-transparent" />
      </div>

      {/* Hero Content (Left Bottom aligned) */}
      <div className="relative z-10 max-w-[1440px] w-full mx-auto px-4 sm:px-8 lg:px-10 pb-16 pt-32 sm:pb-24">
        <div className="max-w-4xl space-y-6 sm:space-y-8">
          {/* Micro Label */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="micro-label text-[var(--ink-2)] tracking-widest block font-medium">
              {copy.hero.microLabel}
            </span>
          </motion.div>

          {/* Huge Headline: split line-by-line mask slide up */}
          <div className="space-y-1">
            {headlineLines.map((line, idx) => (
              <div key={idx} className="overflow-hidden leading-[0.92]">
                <motion.h1
                  initial={{ y: "115%" }}
                  animate={{ y: 0 }}
                  transition={{
                    duration: 0.85,
                    delay: 0.12 * idx,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="text-5xl sm:text-7xl lg:text-[110px] xl:text-[130px] font-light tracking-[-0.03em] text-[var(--ink)]"
                >
                  {line}
                </motion.h1>
              </div>
            ))}
          </div>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-base sm:text-lg lg:text-xl text-[var(--ink-2)] max-w-2xl font-normal leading-relaxed"
          >
            {copy.hero.subline}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <Link
              href="/shop"
              className="group px-8 sm:px-10 h-12 sm:h-14 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] micro-label text-xs tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <span>{copy.hero.cta}</span>
              <ArrowRight
                size={14}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>

            <a
              href={siteConfig.contact.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group px-7 sm:px-9 h-12 sm:h-14 rounded-full border border-[var(--ink)] text-[var(--ink)] micro-label text-xs tracking-widest flex items-center justify-center gap-1.5 hover:bg-[var(--ink)] hover:text-[var(--btn-ink)] active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              <span>{copy.hero.secondaryCta}</span>
              <ArrowUpRight
                size={14}
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
          </motion.div>
        </div>
      </div>

      {/* Floating Interactive Scroll-Down Affordance */}
      <motion.button
        type="button"
        onClick={handleScrollDown}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        aria-label="Scroll ke konten"
        className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 z-20 hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-[var(--line)] bg-[var(--bg)]/80 backdrop-blur-sm text-[11px] font-mono uppercase text-[var(--ink-2)] hover:border-[var(--ink)] hover:text-[var(--ink)] transition-all cursor-pointer shadow-2xs group"
      >
        <span>SCROLL</span>
        <motion.span
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={14} className="group-hover:text-[var(--ink)]" />
        </motion.span>
      </motion.button>
    </section>
  );
};
