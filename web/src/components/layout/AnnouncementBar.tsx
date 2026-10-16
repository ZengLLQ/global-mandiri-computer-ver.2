"use client";

import React, { useEffect, useState } from "react";
import { copy } from "@/config/copy";
import { motion, AnimatePresence } from "framer-motion";

export const AnnouncementBar: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const announcements = copy.announcements;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [announcements.length]);

  return (
    <aside
      aria-label="Pengumuman Toko"
      className="w-full bg-[var(--bg)] border-b border-[var(--line)] py-2 px-4 select-none relative z-40 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[22px]">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="micro-label text-[var(--ink-2)] text-center tracking-wider text-[11px] sm:text-[11.5px]"
          >
            {announcements[currentIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </aside>
  );
};
