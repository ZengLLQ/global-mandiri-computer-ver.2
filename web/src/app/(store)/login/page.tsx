import React, { Suspense } from "react";
import { Metadata } from "next";
import { LoginClient } from "@/components/auth/LoginClient";

export const metadata: Metadata = {
  title: "Masuk Akun | Global Mandiri Computer (GMC)",
  description: "Masuk ke akun Global Mandiri Computer Anda untuk memantau status pesanan dan klaim garansi.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-black border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
