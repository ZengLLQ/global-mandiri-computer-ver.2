import React from "react";
import { Metadata } from "next";
import { AccountClient } from "@/components/account/AccountClient";

export const metadata: Metadata = {
  title: "Akun Saya | Global Mandiri Computer (GMC)",
  description:
    "Kelola data profil, pantau status pesanan, dan kelola alamat pengiriman Anda di Global Mandiri Computer.",
};

export default function AccountPage() {
  return <AccountClient />;
}
