import React from "react";
import { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout Pesanan | Global Mandiri Computer (GMC)",
  description:
    "Formulir konfirmasi pesanan Global Mandiri Computer. Pilih metode ambil di toko ITC Mega Grosir Surabaya atau kirim ke alamat dengan konfirmasi WhatsApp cepat.",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
