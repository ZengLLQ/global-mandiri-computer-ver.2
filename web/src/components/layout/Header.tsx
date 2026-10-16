"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GmcLogo } from "@/components/ui/GmcLogo";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingBag } from "lucide-react";

import { useIsMounted } from "@/hooks/useIsMounted";

const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
];

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const isMounted = useIsMounted();

  const totalCount = useCartStore((state) => state.totalCount());
  const openCartDrawer = useCartStore((state) => state.openDrawer);

  // Close mobile menu on route change during render
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMobileMenuOpen(false);
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={`sticky top-0 z-30 w-full transition-all duration-300 ${
          isScrolled
            ? "bg-[var(--bg)]/95 backdrop-blur-sm border-b border-[var(--line)] shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
            : "bg-[var(--bg)] border-b border-transparent"
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo on the left */}
          <div className="flex-shrink-0">
            <GmcLogo />
          </div>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden md:flex items-center gap-8 lg:gap-12"
          >
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[15px] tracking-tight transition-colors duration-200 relative py-1 ${
                    isActive
                      ? "text-[var(--ink)] font-medium"
                      : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="header-active-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[var(--ink)]"
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Cart Link on Far Right (Real Pill Button with Vector Icon) */}
          <div className="hidden md:flex items-center">
            <button
              type="button"
              onClick={openCartDrawer}
              aria-label={`Buka Keranjang (${isMounted ? totalCount : 0} item)`}
              className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--line)] bg-[var(--panel)] text-[14px] text-[var(--ink)] hover:border-[var(--ink)] active:scale-95 transition-all duration-200 cursor-pointer shadow-2xs"
            >
              <ShoppingBag size={14} strokeWidth={1.8} className="text-[var(--ink)] shrink-0" />
              <span className="font-medium">Keranjang</span>
              <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[11px] font-mono font-medium bg-[var(--ink)] text-[var(--btn-ink)] rounded-full transition-transform duration-200 group-hover:scale-105 tabular-nums">
                {isMounted ? totalCount : 0}
              </span>
            </button>
          </div>

          {/* Mobile Right Controls: Cart trigger + Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={openCartDrawer}
              aria-label={`Keranjang (${isMounted ? totalCount : 0})`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--line)] bg-[var(--panel)] text-[13px] text-[var(--ink)] active:scale-95 transition-all shadow-2xs"
            >
              <ShoppingBag size={13} strokeWidth={1.8} className="text-[var(--ink)] shrink-0" />
              <span>Keranjang</span>
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-mono font-medium bg-[var(--ink)] text-[var(--btn-ink)] rounded-full tabular-nums">
                {isMounted ? totalCount : 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Buka Menu Navigasi"
              className="p-2 text-[var(--ink)] hover:text-black transition-colors rounded-full hover:bg-[var(--panel)]"
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 bg-[var(--bg)] flex flex-col justify-between p-6 sm:p-10"
          >
            {/* Top Bar inside overlay */}
            <div className="flex items-center justify-between">
              <GmcLogo />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Tutup Menu"
                className="p-2 text-[var(--ink)] hover:opacity-70 transition-opacity"
              >
                <X size={28} strokeWidth={1.5} />
              </button>
            </div>

            {/* Menu Links with Staggered Entrance */}
            <nav className="flex flex-col gap-6 my-auto">
              {NAV_LINKS.map((link, idx) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.08 * (idx + 1),
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-4xl sm:text-5xl font-light tracking-tight text-[var(--ink)] hover:opacity-60 transition-opacity"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.08 * (NAV_LINKS.length + 1),
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openCartDrawer();
                  }}
                  className="flex items-center gap-3 text-4xl sm:text-5xl font-light tracking-tight text-[var(--ink)]"
                >
                  <span>Keranjang</span>
                  <span className="text-xl px-2.5 py-0.5 rounded-full bg-[var(--ink)] text-[var(--btn-ink)] font-normal">
                    {isMounted ? totalCount : 0}
                  </span>
                </button>
              </motion.div>
            </nav>

            {/* Bottom info inside overlay */}
            <div className="border-t border-[var(--line)] pt-6 flex flex-col gap-2">
              <span className="micro-label text-[var(--ink-3)]">
                ITC Mega Grosir Lt. 2 Blok B/7, Surabaya
              </span>
              <div className="flex items-center justify-between text-sm text-[var(--ink-2)]">
                <Link
                  href="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="underline hover:text-[var(--ink)]"
                >
                  Akun Saya
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="underline hover:text-[var(--ink)]"
                >
                  Bantuan & FAQ
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
