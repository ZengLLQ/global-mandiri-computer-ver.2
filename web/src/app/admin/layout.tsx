import React from "react";
import type { Metadata } from "next";
import { AdminProviders } from "@/admin/components/providers/AdminProviders";

export const metadata: Metadata = {
  title: {
    default: "GMC Back-Office | Global Mandiri Computer",
    template: "%s | GMC Admin",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminProviders>
      <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col antialiased selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </div>
    </AdminProviders>
  );
}
