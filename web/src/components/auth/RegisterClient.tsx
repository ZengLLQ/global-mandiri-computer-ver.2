"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

export const RegisterClient: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/account";
  const shouldReduceMotion = useReducedMotion();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Simple password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };

  const strength = getPasswordStrength();
  const strengthLabels = ["Sangat Lemah", "Lemah", "Cukup", "Kuat", "Sangat Kuat"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Nama lengkap wajib diisi.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Format email tidak valid.");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 9) {
      setErrorMsg("Nomor WhatsApp minimal 9 digit.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Kata sandi minimal 8 karakter.");
      return;
    }
    if (!agreeTerms) {
      setErrorMsg("Anda harus menyetujui syarat & ketentuan layanan GMC.");
      return;
    }

    setIsLoading(true);

    try {
      await api.register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      router.push(redirectUrl);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Pendaftaran gagal. Email atau nomor telepon mungkin sudah terdaftar.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 border-b border-[#DAD6CC]">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#8B877E] block mb-2">
            Registrasi Pengguna
          </span>
          <h1 className="text-3xl sm:text-4xl font-normal text-[#111111] tracking-tight">
            Buat Akun GMC
          </h1>
          <p className="text-sm text-[#5F5C55] mt-2">
            Daftar untuk kemudahan pelacakan pesanan, invoice digital, dan simpan alamat pengiriman.
          </p>
        </div>

        {/* Panel Form */}
        <div className="bg-white/60 backdrop-blur-sm border border-[#DAD6CC] rounded-[2px] p-6 sm:p-8 shadow-sm">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-[2px] bg-red-50 border border-red-200 text-[#B3261E] text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-[#111111] mb-1.5">
                Nama Lengkap <span className="text-[#B3261E]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-4 py-2.5 text-sm text-[#111111] placeholder-[#8B877E] focus:outline-none focus:border-[#111111] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-[#111111] mb-1.5">
                Alamat Email <span className="text-[#B3261E]">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="budi@example.com"
                className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-4 py-2.5 text-sm text-[#111111] placeholder-[#8B877E] focus:outline-none focus:border-[#111111] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-[#111111] mb-1.5">
                Nomor WhatsApp <span className="text-[#B3261E]">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-4 py-2.5 text-sm text-[#111111] placeholder-[#8B877E] focus:outline-none focus:border-[#111111] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-[#111111] mb-1.5">
                Kata Sandi <span className="text-[#B3261E]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] pl-4 pr-11 py-2.5 text-sm text-[#111111] placeholder-[#8B877E] focus:outline-none focus:border-[#111111] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B877E] hover:text-[#111111] p-1 cursor-pointer"
                  aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="grid grid-cols-4 gap-1.5 h-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full rounded-full transition-colors ${
                          strength >= step
                            ? strength <= 2
                              ? "bg-amber-400"
                              : "bg-emerald-500"
                            : "bg-[#DAD6CC]"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#8B877E] block text-right">
                    Kekuatan: {strengthLabels[strength]}
                  </span>
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#5F5C55]">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-[#DAD6CC] accent-black"
                />
                <span>
                  Saya menyetujui{" "}
                  <Link href="/terms" className="text-[#111111] underline">
                    Syarat & Ketentuan
                  </Link>{" "}
                  dan{" "}
                  <Link href="/privacy" className="text-[#111111] underline">
                    Kebijakan Privasi
                  </Link>{" "}
                  GMC.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-13 bg-[#000000] text-white rounded-full flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-medium hover:bg-black/85 transition-colors disabled:opacity-50 cursor-pointer mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mendaftarkan…</span>
                </>
              ) : (
                <>
                  <span>Daftar Akun</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-[#DAD6CC] text-center">
            <p className="text-xs text-[#5F5C55]">
              Sudah memiliki akun?{" "}
              <Link
                href={`/login${redirectUrl !== "/account" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
                className="font-medium text-[#111111] underline hover:text-black ml-1"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
