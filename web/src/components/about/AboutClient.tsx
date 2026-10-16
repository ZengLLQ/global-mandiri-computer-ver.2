"use client";

import React, { useState } from "react";
import Image from "next/image";
import { copy } from "@/config/copy";
import { brandList } from "@/config/site";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { VisitUs } from "@/components/home/VisitUs";
import { CheckCircle2, Shield, Wrench, Sparkles } from "lucide-react";

export const AboutClient: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = copy.about.tabs;
  const currentTab = tabs[activeTab];
  const shouldReduceMotion = useReducedMotion();

  const getTabIcon = (id: string, isActive: boolean) => {
    const props = {
      size: 14,
      className: `transition-colors ${isActive ? "text-[var(--btn-ink)]" : "text-[var(--ink-2)]"}`,
    };
    switch (id) {
      case "story":
        return <Sparkles {...props} />;
      case "services":
        return <Wrench {...props} />;
      case "authenticity":
        return <Shield {...props} />;
      default:
        return <CheckCircle2 {...props} />;
    }
  };

  return (
    <div className="w-full bg-[var(--bg)] text-[var(--ink)]">
      {/* 1. Lujo-style Editorial text-fade-in (2-Column Asymmetric Header) */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 pt-16 pb-20 border-b border-[var(--line)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-baseline">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 space-y-4"
          >
            <span className="micro-label text-[var(--ink-3)] block tracking-[0.2em]">
              TENTANG GLOBAL MANDIRI COMPUTER
            </span>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-[var(--ink)] leading-[0.96]">
              {copy.about.heroTitle}
            </h1>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 lg:pl-6 space-y-4 text-base sm:text-lg text-[var(--ink-2)] leading-relaxed"
          >
            <p>
              Di GMC, kami percaya bahwa performa komputasi terbaik berakar dari pemilihan komponen yang tepat, instalasi rapi tanpa kompromi, dan jaminan distributor resmi yang menenangkan.
            </p>
            <p className="text-sm text-[var(--ink-3)]">
              Melayani kebutuhan IT perkantoran, perakitan PC gaming, workstation AI, serta pengadaan institusi sejak hadir di ITC Mega Grosir Surabaya.
            </p>
          </motion.div>
        </div>

        {/* 2. Full-bleed Store Media Container (Matches Lujo's about-media) */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 relative aspect-[16/9] md:aspect-[21/9] w-full bg-[var(--panel)] border border-[var(--line)] rounded-[2px] overflow-hidden flex flex-col justify-end p-6 sm:p-12 shadow-sm"
        >
          {/* Background Graphic Slot */}
          <div className="absolute inset-0 flex items-center justify-center p-8 select-none">
            <svg
              className="w-full h-full object-cover opacity-40"
              viewBox="0 0 1600 800"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="1600" height="800" fill="#F2EFE8" />
              <line x1="0" y1="400" x2="1600" y2="400" stroke="#DAD6CC" strokeWidth="1" />
              <line x1="800" y1="0" x2="800" y2="800" stroke="#DAD6CC" strokeWidth="1" />
              <circle cx="800" cy="400" r="300" stroke="#DAD6CC" strokeWidth="1" strokeDasharray="6 6" />
              <circle cx="800" cy="400" r="150" stroke="#DAD6CC" strokeWidth="1" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/40 to-transparent" />
          </div>

          <div className="relative z-10 max-w-xl space-y-2">
            <span className="micro-label text-[var(--ink-2)] tracking-widest block font-medium">
              COUNTER & DISPLAY FISIK GMC SURABAYA
            </span>
            <p className="text-xl sm:text-2xl font-light tracking-tight text-[var(--ink)]">
              ITC Mega Grosir Lt. 2 Blok B/7, Surabaya
            </p>
            <p className="text-xs text-[var(--ink-3)] font-mono">
              [Slot foto counter toko: Anda dapat memperbarui foto display hardware fisik Anda melalui direktori aset]
            </p>
          </div>
        </motion.div>
      </section>

      {/* 3. Second Editorial Statement (Matches Lujo's text_fade_in) */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-20 lg:py-24 border-b border-[var(--line)]">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl space-y-4"
        >
          <span className="micro-label text-[var(--ink-3)] block tracking-widest">
            FILOSOFI KERJA KAMI
          </span>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-[var(--ink)] leading-snug">
            Dari rute kabel tersembunyi hingga kurva kipas yang senyap, setiap unit yang keluar dari meja rakit kami diuji seperti milik kami sendiri.
          </p>
        </motion.div>
      </section>

      {/* 4. Tabbed Storytelling Block: Cerita Kami / Layanan / Brand with sliding pill layoutId */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-20 lg:py-28 border-b border-[var(--line)]">
        {/* Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-14 border-b border-[var(--line)] scrollbar-none">
          {tabs.map((tab, idx) => {
            const isActive = activeTab === idx;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`relative px-6 py-2.5 rounded-full text-xs font-medium tracking-wider whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 border border-transparent ${
                  isActive
                    ? "text-[var(--btn-ink)]"
                    : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-about-tab-indicator"
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 38,
                    }}
                    className="absolute inset-0 bg-[var(--btn)] rounded-full -z-10 shadow-sm"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {getTabIcon(tab.id, isActive)}
                  <span>{tab.title}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content + Synced Media Crossfade */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-5 min-h-[180px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab.id}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink)]" />
                  <span className="micro-label text-[var(--ink-3)] tracking-wider font-mono">
                    BAGIAN 0{activeTab + 1} / 0{tabs.length}
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[var(--ink)] leading-snug">
                  {currentTab.heading}
                </h2>
                <p className="text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
                  {currentTab.content}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="lg:col-span-7">
            <div className="relative aspect-[16/10] w-full bg-[var(--panel)] border border-[var(--line)] rounded-[2px] overflow-hidden p-8 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTab.id}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="relative w-full h-full flex items-center justify-center pointer-events-none"
                >
                  <Image
                    src={currentTab.image.replace(".webp", ".svg")}
                    alt={currentTab.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-contain p-4"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Brand Partner Grid (Text Wordmarks with Gentle Hover Lift) */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-20 lg:py-28 border-b border-[var(--line)]">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <span className="micro-label text-[var(--ink-3)] block mb-2 tracking-widest">
            JARINGAN DISTRIBUTOR RESMI
          </span>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[var(--ink)]">
            Mitra Brand Teknologi Terkemuka
          </h2>
          <p className="text-sm text-[var(--ink-2)] mt-2 max-w-xl">
            Semua unit dan komponen yang didistribusikan oleh GMC dijamin keasliannya dan dilindungi oleh garansi resmi distributor Indonesia.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {brandList.map((brand, i) => (
            <motion.div
              key={brand}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                delay: i * 0.03,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="p-4 sm:p-5 bg-[var(--panel)] border border-[var(--line)] rounded-[2px] text-center flex items-center justify-center hover:border-[var(--ink)] hover:shadow-2xs transition-colors cursor-default"
            >
              <span className="text-sm sm:text-base font-normal tracking-tight text-[var(--ink)]">
                {brand}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 6. Visit Us Block */}
      <VisitUs />
    </div>
  );
};
