"use client";

import React from "react";
import { siteConfig } from "@/config/site";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Clock, MessageCircle, ExternalLink, Navigation } from "lucide-react";

export const VisitUs: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="w-full bg-[var(--bg)] border-b border-[var(--line)] py-20 lg:py-28">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Store Info (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <span className="micro-label text-[var(--ink-3)] block tracking-widest">
              LOKASI FISIK & KONSULTASI
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[var(--ink)]">
              Kunjungi Toko GMC
            </h2>
            <p className="text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
              Temui teknisi kami secara tatap muka untuk konsultasi spesifikasi rakit PC, cek fisik komponen, pengujian hardware, atau pengambilan order instan.
            </p>

            <div className="space-y-4 pt-2 border-t border-[var(--line)]">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-[var(--ink)] mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-[var(--ink)]">{siteConfig.location.mall}</p>
                  <p className="text-[var(--ink-2)]">{siteConfig.location.unit}, {siteConfig.location.city}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock size={18} className="text-[var(--ink)] mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-[var(--ink)]">Jam Buka Counter</p>
                  <p className="text-[var(--ink-2)]">{siteConfig.openingHours}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <a
                href={siteConfig.contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] micro-label text-xs tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer group"
              >
                <MessageCircle size={15} />
                <span>Hubungi Admin WA</span>
              </a>

              <a
                href={siteConfig.location.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-[var(--ink)] text-[var(--ink)] micro-label text-xs tracking-widest hover:bg-[var(--ink)] hover:text-[var(--btn-ink)] transition-colors cursor-pointer group"
              >
                <span>Buka di Google Maps</span>
                <ExternalLink size={13} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>

          {/* Right Map Canvas (7 cols) */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[16/10] w-full bg-[var(--panel)] border border-[var(--line)] rounded-[2px] overflow-hidden p-6 flex flex-col justify-between shadow-2xs">
              {/* Architectural stylized schematic map */}
              <div className="relative w-full h-full rounded border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center p-6 text-center select-none overflow-hidden group/map">
                <svg
                  className="absolute inset-0 w-full h-full opacity-30"
                  viewBox="0 0 800 500"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0 100 H800 M0 250 H800 M0 400 H800" stroke="#DAD6CC" strokeWidth="1" />
                  <path d="M200 0 V500 M400 0 V500 M600 0 V500" stroke="#DAD6CC" strokeWidth="1" />
                  <rect x="360" y="210" width="80" height="80" rx="4" fill="#F2EFE8" stroke="#111111" strokeWidth="2" />
                </svg>

                {/* Radar Pulse Concentric Waves */}
                {!shouldReduceMotion && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.div
                      animate={{
                        scale: [1, 2.2],
                        opacity: [0.6, 0],
                      }}
                      transition={{
                        duration: 2.8,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                      className="w-16 h-16 rounded-full border border-[var(--ink)]/40 absolute"
                    />
                    <motion.div
                      animate={{
                        scale: [1, 2.8],
                        opacity: [0.4, 0],
                      }}
                      transition={{
                        duration: 2.8,
                        repeat: Infinity,
                        delay: 0.9,
                        ease: "easeOut",
                      }}
                      className="w-16 h-16 rounded-full border border-[var(--ink)]/30 absolute"
                    />
                  </div>
                )}

                <div className="relative z-10 space-y-3">
                  <div className="relative w-12 h-12 mx-auto rounded-full bg-[var(--ink)] text-[var(--btn-ink)] flex items-center justify-center shadow-lg transition-transform duration-300 group-hover/map:scale-110">
                    <MapPin size={22} />
                  </div>
                  <h4 className="text-lg font-medium text-[var(--ink)]">
                    ITC Mega Grosir Surabaya
                  </h4>
                  <p className="text-xs text-[var(--ink-2)] max-w-xs mx-auto">
                    Lt. 2 Blok B/7 • Jl. Gembong No. 20-30, Kapasan, Simokerto, Surabaya
                  </p>
                  <a
                    href={siteConfig.location.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium uppercase tracking-wider text-[var(--ink)] underline hover:opacity-75 cursor-pointer"
                  >
                    <Navigation size={12} />
                    <span>Navigasi Rute Maps</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
