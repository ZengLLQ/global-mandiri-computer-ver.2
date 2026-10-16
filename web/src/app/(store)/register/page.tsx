import React, { Suspense } from "react";
import { Metadata } from "next";
import { RegisterClient } from "@/components/auth/RegisterClient";

export const metadata: Metadata = {
  title: "Daftar Akun Baru | Global Mandiri Computer (GMC)",
  description: "Daftar akun baru di Global Mandiri Computer untuk kemudahan pemesanan IT hardware dan pelacakan garansi.",
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-black border-t-transparent animate-spin" />
        </div>
      }
    >
      <RegisterClient />
    </Suspense>
  );
}
