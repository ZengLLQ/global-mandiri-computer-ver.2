"use client";

import React, { useState } from "react";
import {
  useAdminMe,
  useAdminChangePasswordMutation,
  useAdminTotpSetupMutation,
  useAdminTotpEnableMutation,
  useAdminTotpDisableMutation,
} from "@/lib/api/hooks/useAdminApi";
import { QRCodeSVG } from "qrcode.react";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  User,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  ShieldOff,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminAccountPage() {
  const { data: user, refetch } = useAdminMe();

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // TOTP setup state
  const [setupStep, setSetupStep] = useState(false);
  const [setupData, setSetupData] = useState<{
    qrDataUrl: string;
    secret: string;
    backupCodes: string[];
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [copiedCodes, setCopiedCodes] = useState(false);

  // TOTP disable state
  const [disableModal, setDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");

  const changePasswordMutation = useAdminChangePasswordMutation();
  const totpSetupMutation = useAdminTotpSetupMutation();
  const totpEnableMutation = useAdminTotpEnableMutation();
  const totpDisableMutation = useAdminTotpDisableMutation();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Kata sandi baru minimal 8 karakter.");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      toast.success("Kata sandi berhasil diperbarui!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Gagal memperbarui kata sandi.");
    }
  };

  const startTotpSetup = async () => {
    try {
      const res = await totpSetupMutation.mutateAsync();
      setSetupData(res);
      setSetupStep(true);
    } catch (err: any) {
      toast.error(err?.message || "Gagal memulai penyiapan 2FA.");
    }
  };

  const handleConfirmTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode || verifyCode.trim().length < 6) {
      toast.error("Masukkan 6 digit kode dari aplikasi otentikator.");
      return;
    }

    try {
      await totpEnableMutation.mutateAsync({
        code: verifyCode.trim(),
      });
      toast.success("Otentikasi Dua Faktor (2FA) berhasil diaktifkan!");
      setSetupStep(false);
      setSetupData(null);
      setVerifyCode("");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Kode 2FA tidak valid.");
    }
  };

  const handleDisableTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await totpDisableMutation.mutateAsync({
        password: disablePassword,
      });
      toast.success("2FA berhasil dinonaktifkan.");
      setDisableModal(false);
      setDisablePassword("");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Gagal menonaktifkan 2FA. Periksa kata sandi Anda.");
    }
  };

  const copyBackupCodes = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.backupCodes.join("\n"));
    setCopiedCodes(true);
    toast.success("Kode pemulihan darurat disalin ke papan klip!");
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Pengaturan Akun & Keamanan</h1>
        <p className="text-sm text-slate-400 mt-1">
          Kelola profil pengguna internal, perbarui kata sandi, dan amankan akun dengan Verifikasi Dua Faktor (2FA).
        </p>
      </div>

      {/* Profile Overview */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Profil Pengguna</h2>
            <p className="text-xs text-slate-400">Informasi akun operasional GMC</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="block text-xs font-semibold uppercase text-slate-500 mb-1">Nama Lengkap</span>
            <span className="text-white font-medium">{user?.name || "-"}</span>
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase text-slate-500 mb-1">Email Internal</span>
            <span className="text-white font-medium">{user?.email || "-"}</span>
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase text-slate-500 mb-1">Nomor Telepon</span>
            <span className="text-white font-medium">{user?.phone || "-"}</span>
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase text-slate-500 mb-1">Peran Akses</span>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-amber-400 border border-slate-700">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Ganti Kata Sandi</h2>
            <p className="text-xs text-slate-400">
              Gunakan minimal 8 karakter dengan kombinasi angka dan simbol
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Kata Sandi Saat Ini
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Kata Sandi Baru
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Konfirmasi Kata Sandi Baru
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi baru"
              className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs tracking-wide rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer mt-2"
          >
            {changePasswordMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              "Simpan Kata Sandi Baru"
            )}
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication (2FA) */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Verifikasi Dua Faktor (2FA)</h2>
              <p className="text-xs text-slate-400">
                Amankan login dengan Google Authenticator atau aplikasi TOTP lainnya
              </p>
            </div>
          </div>

          <div>
            {user?.hasTotp ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>2FA Aktif</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                <span>Belum Aktif</span>
              </span>
            )}
          </div>
        </div>

        {!user?.hasTotp && !setupStep && (
          <div>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              Verifikasi dua faktor menambahkan lapisan keamanan ekstra. Setiap kali masuk, Anda akan diminta memasukkan kode 6 digit dari ponsel Anda.
            </p>
            <button
              onClick={startTotpSetup}
              disabled={totpSetupMutation.isPending}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs tracking-wide rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20"
            >
              {totpSetupMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyiapkan...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Aktifkan 2FA Sekarang</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 2FA Setup Workflow */}
        {!user?.hasTotp && setupStep && setupData && (
          <div className="space-y-6 bg-slate-900/60 p-6 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Langkah 1: Pindai Kode QR</h3>
              <p className="text-xs text-slate-400 mb-4">
                Buka aplikasi Authenticator (Google Authenticator / Authy) dan pindai kode QR berikut:
              </p>
              <div className="p-4 bg-white rounded-xl inline-block shadow-md">
                <QRCodeSVG value={setupData.qrDataUrl} size={180} />
              </div>
              <div className="mt-3 text-xs text-slate-400">
                Atau masukkan kunci rahasia secara manual:{" "}
                <code className="text-amber-400 font-mono font-bold bg-slate-800 px-2 py-0.5 rounded">
                  {setupData.secret}
                </code>
              </div>
            </div>

            {/* Backup Codes */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white">Langkah 2: Simpan Kode Pemulihan Darurat</h3>
                <button
                  type="button"
                  onClick={copyBackupCodes}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                >
                  {copiedCodes ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCodes ? "Tersalin!" : "Salin Semua Kode"}</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Simpan kode-kode ini di tempat yang aman. Setiap kode dapat digunakan satu kali jika Anda kehilangan akses ke ponsel.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 text-center tracking-wider">
                {setupData.backupCodes.map((code, idx) => (
                  <div key={idx} className="p-1.5 bg-slate-900 rounded">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Code */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold text-white mb-1">Langkah 3: Konfirmasi Kode Verifikasi</h3>
              <p className="text-xs text-slate-400 mb-3">
                Masukkan 6 digit kode yang muncul di aplikasi Authenticator untuk mengonfirmasi:
              </p>
              <form onSubmit={handleConfirmTotp} className="flex flex-col sm:flex-row gap-3 max-w-sm">
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="000000"
                  className="px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-center font-mono tracking-widest text-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={totpEnableMutation.isPending}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {totpEnableMutation.isPending ? "Mengonfirmasi..." : "Aktifkan"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 2FA Enabled State */}
        {user?.hasTotp && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">Akun Anda dilindungi 2FA</p>
                <p className="text-xs text-slate-400">Verifikasi dua langkah aktif untuk setiap sesi login baru.</p>
              </div>
            </div>

            <button
              onClick={() => setDisableModal(true)}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl transition-all cursor-pointer self-start sm:self-auto"
            >
              Nonaktifkan 2FA
            </button>
          </div>
        )}

        {/* Modal: Nonaktifkan 2FA */}
        {disableModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#131B2E] border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-3 text-rose-400 mb-4">
                <ShieldOff className="w-6 h-6" />
                <h3 className="text-lg font-bold text-white">Nonaktifkan 2FA</h3>
              </div>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Menonaktifkan 2FA akan mengurangi keamanan akun Anda. Masukkan kata sandi saat ini untuk mengonfirmasi:
              </p>
              <form onSubmit={handleDisableTotp} className="space-y-4">
                <div>
                  <input
                    type="password"
                    required
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Kata sandi saat ini"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDisableModal(false);
                      setDisablePassword("");
                    }}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={totpDisableMutation.isPending}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl disabled:opacity-50"
                  >
                    {totpDisableMutation.isPending ? "Memproses..." : "Ya, Nonaktifkan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
