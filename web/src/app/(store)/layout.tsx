import React from "react";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ClientProviders } from "@/components/providers/ClientProviders";

export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClientProviders>
      <AnnouncementBar />
      <React.Suspense fallback={<div className="h-16 sm:h-20 bg-[var(--bg)]" />}>
        <Header />
      </React.Suspense>
      <main className="flex-1 w-full">{children}</main>
      <CartDrawer />
      <Footer />
    </ClientProviders>
  );
}
