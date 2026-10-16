"use client";

import React from "react";
import { brandList } from "@/config/site";

export const BrandMarquee: React.FC = () => {
  // Duplicate list to achieve seamless infinite loop
  const brands = [...brandList, ...brandList];

  return (
    <section className="w-full bg-[var(--panel)] border-b border-[var(--line)] py-10 overflow-hidden select-none">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 mb-4">
        <span className="micro-label text-[var(--ink-3)] block text-center">
          DISTRIBUSI RESMI & MITRA HARDWARE
        </span>
      </div>

      <div className="relative w-full flex overflow-x-hidden group">
        <div className="flex items-center gap-10 sm:gap-14 animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused] py-2">
          {brands.map((brand, idx) => (
            <span
              key={`${brand}-${idx}`}
              className="text-lg sm:text-2xl font-light tracking-tight text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-default"
            >
              {brand}
            </span>
          ))}
        </div>

        {/* Gradient edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--panel)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--panel)] to-transparent" />
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
      `}</style>
    </section>
  );
};
