"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

export const LoginClient: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/account";
  const shouldReduceMotion = useReducedMotion();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!identifier.trim() || !password.trim()) {
      setErrorMsg("Email / nomor WhatsApp dan kata sandi wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      await api.login({
        email: identifier.trim(),
        password: password.trim(),
      });
      router.push(redirectUrl);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Identitas atau kata sandi tidak sesuai.");
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSent(true);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 border-b border-[#DAD6CC]">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#8B877E] block mb-2">
            Autentikasi Akun
          </span>
          <h1 className="text-3xl sm:text-4xl font-normal text-[#111111] tracking-tight">
            Masuk ke GMC
          </h1>
          <p className="text-sm text-[#5F5C55] mt-2">
            Kelola pesanan, pantau status garansi, dan kelola alamat pengiriman Anda.
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-[#111111] mb-2">
                Email atau Nomor WhatsApp
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="nama@email.com atau 08xxxxxxxxxx"
                className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-4 py-3 text-sm text-[#111111] placeholder-[#8B877E] focus:outline-none focus:border-[#111111] transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-wider font-medium text-[#111111]">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-[#5F5C55] hover:text-[#111111] underline cursor-pointer"
                >
                  Lupa sandi?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] pl-4 pr-11 py-3 text-sm text-[#111111] placeholder-[#8B877E] focus:outline-none focus:border-[#111111] transition-colors"
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
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-13 bg-[#000000] text-white rounded-full flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-medium hover:bg-black/85 transition-colors disabled:opacity-50 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi…</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Akun</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 pt-6 border-t border-[#DAD6CC] text-center">
            <p className="text-xs text-[#5F5C55]">
              Belum memiliki akun GMC?{" "}
              <Link
                href={`/register${redirectUrl !== "/account" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
                className="font-medium text-[#111111] underline hover:text-black ml-1"
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>

        {/* Forgot password modal with AnimatePresence */}
        <AnimatePresence>
          {showForgot && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.94, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0.94, opacity: 0, y: 8 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="bg-[#FBF7EF] border border-[#DAD6CC] rounded-[2px] p-6 sm:p-8 max-w-sm w-full shadow-xl"
              >
                <h3 className="text-lg font-medium text-[#111111] mb-2">Lupa Kata Sandi</h3>
                <p className="text-xs text-[#5F5C55] mb-4">
                  Masukkan email yang terdaftar untuk menerima tautan pemulihan kata sandi.
                </p>

                {forgotSent ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-[2px] text-xs text-[#2F6B3F] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Tautan instruksi pemulihan telah dikirim ke email Anda jika terdaftar.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgot(false);
                        setForgotSent(false);
                      }}
                      className="w-full py-2.5 bg-[#000000] text-white rounded-full text-xs uppercase tracking-wider font-medium cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-3 py-2 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowForgot(false)}
                        className="flex-1 py-2.5 border border-[#DAD6CC] rounded-full text-xs uppercase tracking-wider text-[#5F5C55] cursor-pointer hover:bg-neutral-100 transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-[#000000] text-white rounded-full text-xs uppercase tracking-wider font-medium cursor-pointer hover:bg-black/85 transition-colors"
                      >
                        Kirim
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
