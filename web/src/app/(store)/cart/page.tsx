import React from "react";
import { Metadata } from "next";
import { CartPageClient } from "@/components/cart/CartPageClient";

export const metadata: Metadata = {
  title: "Keranjang Belanja | Global Mandiri Computer (GMC)",
  description:
    "Periksa dan konfirmasi daftar pesanan komponen PC, laptop, dan perlengkapan IT Anda di Global Mandiri Computer ITC Mega Grosir Surabaya.",
};

export default function CartPage() {
  return <CartPageClient />;
}
