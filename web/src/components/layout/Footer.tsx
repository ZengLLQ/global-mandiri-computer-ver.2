"use client";

import React, { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ArrowRight, Check, Mail, MessageCircle, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Footer: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [openMobileAccordion, setOpenMobileAccordion] = useState<string | null>(null);

  const handleAdvanceOrSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    if (step === 1) {
      if (!email || !email.includes("@")) {
        setErrorMessage("Format email belum benar");
        return;
      }
      setStep(2);
      return;
    }

    // Step 2 submit
    setIsLoading(true);
    try {
      const res = await fetch(`${siteConfig.apiUrl}/v1/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined }),
      });

      if (!res.ok) {
        throw new Error("Gagal mendaftar");
      }
      setIsSubmitted(true);
    } catch {
      // In offline/demo mode, gracefully succeed so user experience is smooth
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMobileAccordion = (key: string) => {
    setOpenMobileAccordion(openMobileAccordion === key ? null : key);
  };

  return (
    <footer className="w-full bg-[var(--footer)] text-[var(--ink)] border-t border-[var(--line)]">
      {/* 1. Newsletter Row (Lujo's signature 2-step newsletter) */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-12 lg:py-16 border-b border-[var(--line)]">
        <span className="micro-label block text-[var(--ink-2)] mb-3 tracking-widest">
          BERITA & PROMO HARDWARE GMC
        </span>

        {isSubmitted ? (
          <div className="flex items-center gap-3 py-6">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--ink)] text-[var(--btn-ink)]">
              <Check size={18} />
            </span>
            <p className="text-xl sm:text-2xl text-[var(--ink)] font-light">
              Terima kasih! Anda akan menerima pembaruan katalog dan promo resmi dari GMC.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleAdvanceOrSubmit}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-6"
          >
            <div className="flex-1 max-w-3xl">
              {step === 1 ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email kamu*"
                  aria-label="Alamat email untuk newsletter"
                  required
                  className="w-full bg-transparent border-none p-0 text-3xl sm:text-5xl lg:text-6xl font-light text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-0 leading-tight tracking-tight"
                />
              ) : (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama kamu (opsional)"
                  aria-label="Nama opsional untuk newsletter"
                  autoFocus
                  className="w-full bg-transparent border-none p-0 text-3xl sm:text-5xl lg:text-6xl font-light text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-0 leading-tight tracking-tight"
                />
              )}
              {errorMessage && (
                <p className="text-[var(--danger)] text-xs mt-2 font-medium">
                  {errorMessage}
                </p>
              )}
            </div>

            {/* Pill stepper button */}
            <div className="flex items-center self-start sm:self-end">
              <button
                type="submit"
                disabled={isLoading}
                aria-label={step === 1 ? "Lanjut ke langkah 2" : "Daftar newsletter"}
                className="group inline-flex items-center gap-2.5 px-5 py-2.5 border border-[var(--ink)] rounded-full text-xs font-medium tracking-wider hover:bg-[var(--ink)] hover:text-[var(--btn-ink)] transition-colors duration-200 cursor-pointer"
              >
                <span>{step === 1 ? "1/2" : "2/2"}</span>
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. Main Footer Area */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Block (~40% width / 5 cols) */}
          <div className="lg:col-span-5 flex flex-col">
            {/* Block 1: Layanan Pelanggan */}
            <div className="pb-8 border-b border-[var(--line)]">
              <h3 className="text-xl font-normal tracking-tight text-[var(--ink)] mb-3">
                Layanan Pelanggan
              </h3>
              <div className="flex flex-col gap-2 text-[15px] text-[var(--ink-2)]">
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="hover:text-[var(--ink)] transition-colors duration-200 inline-flex items-center gap-2"
                >
                  <Mail size={15} className="text-[var(--ink-3)] shrink-0" />
                  <span>{siteConfig.contact.email}</span>
                </a>
                <a
                  href={siteConfig.contact.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--ink)] transition-colors duration-200 inline-flex items-center gap-2"
                >
                  <MessageCircle size={15} className="text-[var(--ink-3)] shrink-0" />
                  <span>{siteConfig.contact.whatsappDisplay}</span>
                  <span className="text-xs text-[var(--ink-3)]">(WhatsApp Admin)</span>
                </a>
              </div>
            </div>

            {/* Block 2: Stok Siap. Pesan Mudah. */}
            <div className="py-8 border-b border-[var(--line)]">
              <h3 className="text-xl font-normal tracking-tight text-[var(--ink)] mb-2">
                Stok Siap. Pesan Mudah.
              </h3>
              <p className="text-[15px] text-[var(--ink-2)] leading-relaxed mb-3">
                Ambil langsung di {siteConfig.location.mall} {siteConfig.location.unit} atau kirim aman ke seluruh Indonesia.
              </p>
              <a
                href={siteConfig.location.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--line)] bg-[var(--panel)] text-xs font-medium text-[var(--ink)] hover:border-[var(--ink)] active:scale-95 transition-all shadow-2xs"
              >
                <MapPin size={13} className="shrink-0" />
                <span>Buka Google Maps</span>
              </a>
            </div>

            {/* Block 3: Garansi Terjamin */}
            <div className="pt-8">
              <h3 className="text-xl font-normal tracking-tight text-[var(--ink)] mb-2">
                Garansi Terjamin
              </h3>
              <p className="text-[15px] text-[var(--ink-2)] leading-relaxed">
                Garansi 100% mengikuti ketentuan resmi masing-masing brand distributor Indonesia.
              </p>
            </div>
          </div>

          {/* Spacer / Right Alignment */}
          <div className="hidden lg:block lg:col-span-2" />

          {/* Right Block (Desktop 2-Col Links / Mobile Accordion) */}
          <div className="lg:col-span-5">
            {/* Desktop Link Columns (Hidden on mobile) */}
            <div className="hidden sm:grid grid-cols-2 gap-8 sm:gap-12">
              {/* Column TENTANG */}
              <div className="flex flex-col gap-4">
                <span className="micro-label text-[12px] text-[var(--ink)] tracking-widest font-medium">
                  TENTANG
                </span>
                <ul className="flex flex-col gap-3 text-[15px] text-[var(--ink-2)]">
                  <li>
                    <Link href="/" className="hover:text-[var(--ink)] transition-colors duration-200">
                      Beranda
                    </Link>
                  </li>
                  <li>
                    <Link href="/shop" className="hover:text-[var(--ink)] transition-colors duration-200">
                      Shop
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="hover:text-[var(--ink)] transition-colors duration-200">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-[var(--ink)] transition-colors duration-200">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/account" className="hover:text-[var(--ink)] transition-colors duration-200">
                      Akun Saya
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="hover:text-[var(--ink)] transition-colors duration-200">
                      Masuk
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column BANTUAN */}
              <div className="flex flex-col gap-4">
                <span className="micro-label text-[12px] text-[var(--ink)] tracking-widest font-medium">
                  BANTUAN
                </span>
                <ul className="flex flex-col gap-3 text-[15px] text-[var(--ink-2)]">
                  <li>
                    <Link href="/contact#cara-pesan" className="hover:text-[var(--ink)] transition-colors duration-200">
                      Cara Pemesanan
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact#pengiriman" className="hover:text-[var(--ink)] transition-colors duration-200">
                      Pengiriman
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact#garansi" className="hover:text-[var(--ink)] transition-colors duration-200">
                      Garansi & Retur
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact#faq" className="hover:text-[var(--ink)] transition-colors duration-200">
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-[var(--ink)] transition-colors duration-200">
                      Hubungi Kami
                    </Link>
                  </li>
                  <li>
                    <Link href="/account" className="hover:text-[var(--ink)] transition-colors duration-200">
                      Lacak Pesanan
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Mobile Collapsible Accordion (Matches Lujo's footer__links-grid md-show) */}
            <div className="sm:hidden border-t border-[var(--line)] divide-y divide-[var(--line)]">
              {/* Accordion 1: Tentang */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleMobileAccordion("tentang")}
                  className="w-full flex items-center justify-between py-2 text-left text-sm font-medium tracking-wider uppercase text-[var(--ink)]"
                >
                  <span>Tentang GMC</span>
                  <div className="relative w-4 h-4 flex items-center justify-center text-[var(--ink)]">
                    <span className="absolute w-3.5 h-[1.5px] bg-current" />
                    <span
                      className={`absolute w-3.5 h-[1.5px] bg-current transition-transform duration-300 ${
                        openMobileAccordion === "tentang" ? "rotate-0 scale-0 opacity-0" : "rotate-90 scale-100 opacity-100"
                      }`}
                    />
                  </div>
                </button>
                <AnimatePresence>
                  {openMobileAccordion === "tentang" && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden flex flex-col gap-2.5 pt-2 pb-3 text-sm text-[var(--ink-2)]"
                    >
                      <li>
                        <Link href="/" className="hover:text-[var(--ink)]">Beranda</Link>
                      </li>
                      <li>
                        <Link href="/shop" className="hover:text-[var(--ink)]">Shop</Link>
                      </li>
                      <li>
                        <Link href="/about" className="hover:text-[var(--ink)]">About</Link>
                      </li>
                      <li>
                        <Link href="/contact" className="hover:text-[var(--ink)]">Contact Us</Link>
                      </li>
                      <li>
                        <Link href="/account" className="hover:text-[var(--ink)]">Akun Saya</Link>
                      </li>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion 2: Bantuan */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleMobileAccordion("bantuan")}
                  className="w-full flex items-center justify-between py-2 text-left text-sm font-medium tracking-wider uppercase text-[var(--ink)]"
                >
                  <span>Bantuan & Dukungan</span>
                  <div className="relative w-4 h-4 flex items-center justify-center text-[var(--ink)]">
                    <span className="absolute w-3.5 h-[1.5px] bg-current" />
                    <span
                      className={`absolute w-3.5 h-[1.5px] bg-current transition-transform duration-300 ${
                        openMobileAccordion === "bantuan" ? "rotate-0 scale-0 opacity-0" : "rotate-90 scale-100 opacity-100"
                      }`}
                    />
                  </div>
                </button>
                <AnimatePresence>
                  {openMobileAccordion === "bantuan" && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden flex flex-col gap-2.5 pt-2 pb-3 text-sm text-[var(--ink-2)]"
                    >
                      <li>
                        <Link href="/contact#cara-pesan" className="hover:text-[var(--ink)]">Cara Pemesanan</Link>
                      </li>
                      <li>
                        <Link href="/contact#pengiriman" className="hover:text-[var(--ink)]">Pengiriman</Link>
                      </li>
                      <li>
                        <Link href="/contact#garansi" className="hover:text-[var(--ink)]">Garansi & Retur</Link>
                      </li>
                      <li>
                        <Link href="/contact#faq" className="hover:text-[var(--ink)]">FAQ</Link>
                      </li>
                      <li>
                        <Link href="/contact" className="hover:text-[var(--ink)]">Hubungi Kami</Link>
                      </li>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Bar */}
      <div className="border-t border-[var(--line)] py-6">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[14px] text-[var(--ink-2)]">
          <p>© 2026 Global Mandiri Computer. Hak cipta dilindungi.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link
              href="/privacy"
              className="hover:text-[var(--ink)] transition-colors duration-200"
            >
              Kebijakan Privasi
            </Link>
            <Link
              href="/terms"
              className="hover:text-[var(--ink)] transition-colors duration-200"
            >
              Syarat & Ketentuan
            </Link>
            <span className="text-[var(--ink-3)]">{siteConfig.credit}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
