"use client";

import React, { useState } from "react";
import Image from "next/image";
import { copy } from "@/config/copy";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ShieldCheck,
  Store,
  Cpu,
  BadgePercent,
  Headphones,
  CheckCircle,
} from "lucide-react";

export const WhyGmc: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const pillars = copy.whyGmc.pillars;
  const currentPillar = pillars[activeTab];
  const shouldReduceMotion = useReducedMotion();

  const getPillarIcon = (id: string, isActive: boolean) => {
    const props = {
      size: 14,
      className: `transition-colors ${isActive ? "text-[var(--btn-ink)]" : "text-[var(--ink-2)]"}`,
    };
    switch (id) {
      case "original":
        return <ShieldCheck {...props} />;
      case "ready-stock":
        return <Store {...props} />;
      case "pc-consultation":
        return <Cpu {...props} />;
      case "competitive-price":
        return <BadgePercent {...props} />;
      case "after-sales":
        return <Headphones {...props} />;
      default:
        return <CheckCircle {...props} />;
    }
  };

  return (
    <section className="w-full bg-[var(--bg)] border-b border-[var(--line)] py-20 lg:py-28">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="mb-12 lg:mb-16">
          <span className="micro-label text-[var(--ink-3)] block mb-2 tracking-widest">
            NILAI & LAYANAN GMC
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[var(--ink)]">
            {copy.whyGmc.title}
          </h2>
          <p className="text-sm text-[var(--ink-2)] mt-2 max-w-xl">
            {copy.whyGmc.subtitle}
          </p>
        </div>

        {/* Tab Buttons Strip with layoutId sliding pill */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-12 scrollbar-none border-b border-[var(--line)]">
          {pillars.map((pillar, idx) => {
            const isActive = activeTab === idx;
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`relative px-5 py-2.5 rounded-full text-xs font-medium tracking-wider whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 border border-transparent ${
                  isActive
                    ? "text-[var(--btn-ink)]"
                    : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-why-tab-indicator"
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 38,
                    }}
                    className="absolute inset-0 bg-[var(--btn)] rounded-full -z-10 shadow-sm"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {getPillarIcon(pillar.id, isActive)}
                  <span>{pillar.title}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Synced Content & Image Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Text Block (5 cols) */}
          <div className="lg:col-span-5 min-h-[180px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPillar.id}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink)]" />
                  <span className="micro-label text-[var(--ink-3)] tracking-widest font-mono">
                    PILAR 0{activeTab + 1} / 0{pillars.length}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-[var(--ink)] leading-snug">
                  {currentPillar.heading}
                </h3>
                <p className="text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
                  {currentPillar.desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Image Stage (7 cols) */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[16/10] w-full bg-[var(--panel)] border border-[var(--line)] rounded-[2px] overflow-hidden p-6 sm:p-10 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPillar.id}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="relative w-full h-full flex items-center justify-center pointer-events-none"
                >
                  <Image
                    src={currentPillar.image.replace(".webp", ".svg")}
                    alt={currentPillar.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-contain p-4"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
