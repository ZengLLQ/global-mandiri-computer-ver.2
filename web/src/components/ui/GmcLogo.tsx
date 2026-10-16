import React from "react";
import Link from "next/link";

interface GmcLogoProps {
  className?: string;
  showSubtitle?: boolean;
}

export const GmcLogo: React.FC<GmcLogoProps> = ({ className = "", showSubtitle = false }) => {
  return (
    <Link
      href="/"
      aria-label="Global Mandiri Computer - Beranda"
      className={`inline-flex items-center gap-2 group select-none ${className}`}
    >
      <div className="flex flex-col">
        <div className="flex items-center">
          {/* Bold geometric/neo-grotesque GMC SVG wordmark */}
          <svg
            viewBox="0 0 110 32"
            height="26"
            className="w-auto h-6 sm:h-7 fill-current text-[var(--ink)] tracking-tighter"
            aria-hidden="true"
          >
            <text
              x="0"
              y="25"
              fontFamily="var(--font-inter), system-ui, -apple-system, sans-serif"
              fontSize="29"
              fontWeight="900"
              letterSpacing="-0.06em"
            >
              GMC
            </text>
            {/* Geometric accent dot */}
            <circle cx="86" cy="22" r="3" fill="var(--ink)" />
          </svg>
        </div>
        {showSubtitle && (
          <span className="micro-label text-[10px] text-[var(--ink-2)] -mt-1 tracking-widest">
            GLOBAL MANDIRI COMPUTER
          </span>
        )}
      </div>
    </Link>
  );
};
