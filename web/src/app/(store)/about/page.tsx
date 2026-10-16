import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { AboutClient } from "@/components/about/AboutClient";

export const metadata: Metadata = {
  title: `Tentang Kami | ${siteConfig.shortName} - ${siteConfig.name}`,
  description:
    "Profil toko komputer Global Mandiri Computer (GMC) ITC Mega Grosir Surabaya. Spesialis hardware, konsultasi rakit PC, dan garansi resmi.",
};

export default function AboutPage() {
  return <AboutClient />;
}
