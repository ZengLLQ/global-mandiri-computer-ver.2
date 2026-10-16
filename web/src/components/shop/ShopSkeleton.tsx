import React from "react";

export const ShopSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-[var(--bg)] min-h-screen animate-pulse">
      {/* Banner Skeleton */}
      <div className="w-full pt-12 pb-10 sm:pt-16 sm:pb-14 border-b border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-baseline">
            <div className="lg:col-span-6 space-y-3">
              <div className="w-32 h-3 bg-[var(--line)] rounded" />
              <div className="w-72 h-14 bg-[var(--line)] rounded" />
            </div>
            <div className="lg:col-span-6 space-y-2">
              <div className="w-full h-4 bg-[var(--line)] rounded" />
              <div className="w-3/4 h-4 bg-[var(--line)] rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="w-full border-b border-[var(--line)] py-3">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 flex items-center justify-between">
          <div className="flex gap-2">
            <div className="w-20 h-8 bg-[var(--line)] rounded-full" />
            <div className="w-28 h-8 bg-[var(--line)] rounded-full" />
            <div className="w-24 h-8 bg-[var(--line)] rounded-full" />
          </div>
          <div className="w-24 h-8 bg-[var(--line)] rounded-full" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square w-full bg-[var(--panel)] border border-[var(--line)] rounded-[2px]" />
              <div className="w-20 h-2.5 bg-[var(--line)] rounded" />
              <div className="w-full h-4 bg-[var(--line)] rounded" />
              <div className="w-28 h-4 bg-[var(--line)] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
