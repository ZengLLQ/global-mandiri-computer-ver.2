import React from "react";
import { Metadata } from "next";
import { ContactClient } from "@/components/contact/ContactClient";

export const metadata: Metadata = {
  title: "Hubungi Kami | Global Mandiri Computer (GMC)",
  description:
    "Hubungi Global Mandiri Computer di ITC Mega Grosir Surabaya. Konsultasi spesifikasi PC, info stok, pemesanan via WhatsApp, dan pertanyaan umum.",
};

export default function ContactPage() {
  return <ContactClient />;
}
