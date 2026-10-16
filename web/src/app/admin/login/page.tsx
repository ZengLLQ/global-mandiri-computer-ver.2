"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminLoginMutation } from "@/lib/api/hooks/useAdminApi";
import { Shield, Lock, Mail, KeyRound, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [is2FAStep, setIs2FAStep] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loginMutation = useAdminLoginMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const res = await loginMutation.mutateAsync({
        email,
        password,
        totpCode: is2FAStep ? totpCode : undefined,
      });

      if (res.require2fa) {
        setIs2FAStep(true);
        if (res.tempToken) {
          setTempToken(res.tempToken);
        }
        toast.info("Masukkan kode otentikator 2FA untuk melanjutkan.");
        return;
      }

      toast.success("Berhasil masuk ke GMC Back-Office");

      if (res.mustChangePassword) {
        toast.warning("Anda harus memperbarui kata sandi terlebih dahulu.");
        router.push("/admin/account?force=password");
      } else {
        router.push("/admin");
      }
    } catch (err: any) {
      const msg = err?.message || "Gagal masuk. Periksa kembali email dan kata sandi Anda.";
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] p-4 text-slate-100">
      <div className="w-full max-w-md bg-[#131B2E] border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center mb-8 text-center relative z-10">
          <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4 shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">GMC Back-Office</h1>
          <p className="text-sm text-slate-400 mt-1">
            {is2FAStep
              ? "Verifikasi Dua Faktor (2FA)"
              : "Masuk ke Panel Administrasi Toko"}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          {!is2FAStep ? (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                  Email Staf / Pemilik
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@globalmandiri.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Kode Autentikator (TOTP) / Kode Pemulihan
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={16}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="Contoh: 123456"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-mono tracking-widest text-center transition-all"
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Buka aplikasi Google Authenticator atau masukkan salah satu kode pemulihan darurat Anda.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-6"
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : is2FAStep ? (
              "Verifikasi & Masuk"
            ) : (
              "Masuk ke Sistem"
            )}
          </button>

          {is2FAStep && (
            <button
              type="button"
              onClick={() => {
                setIs2FAStep(false);
                setTotpCode("");
                setErrorMessage("");
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200 mt-2 transition-colors cursor-pointer"
            >
              Kembali ke email & kata sandi
            </button>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
          Global Mandiri Computer &bull; Back-Office Akses Terbatas
        </div>
      </div>
    </div>
  );
}
