import React from "react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { siteConfig } from "@/config/site";


const ppNeueMontreal = localFont({
  src: [
    {
      path: "../../public/fonts/PPNeueMontreal-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/PPNeueMontreal-Medium.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-neue-montreal",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.shortName} | ${siteConfig.name} - ITC Mega Grosir Surabaya`,
    template: `%s | ${siteConfig.shortName} - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL("https://globalmandiricomputer.com"),
  keywords: [
    "Komputer Surabaya",
    "Toko Komputer ITC Mega Grosir",
    "Rakit PC Surabaya",
    "Hardware Komputer",
    "Laptop Surabaya",
    "VGA Surabaya",
    "Starlink Surabaya",
    "Global Mandiri Computer",
    "GMC ITC",
  ],
  authors: [{ name: siteConfig.name }],
  openGraph: {
    title: `${siteConfig.name} - IT Hardware Store Surabaya`,
    description: siteConfig.description,
    url: "https://globalmandiricomputer.com",
    siteName: siteConfig.name,
    locale: "id_ID",
    type: "website",
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#FBF7EF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${ppNeueMontreal.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--ink)] font-sans">
        {children}
      </body>
    </html>
  );
}
