"use client";

import React from "react";
import Link from "next/link";
import {
  useAdminMe,
  useAdminCounters,
} from "@/lib/api/hooks/useAdminApi";
import {
  ShoppingBag,
  AlertTriangle,
  MessageSquare,
  Star,
  PlusCircle,
  PackagePlus,
  Sliders,
  TicketPercent,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { data: user } = useAdminMe();
  const { data: counters, isLoading: countersLoading } = useAdminCounters();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#131B2E] border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Panel Kendali Back-Office</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Selamat datang, {user?.name || "Administrator"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Kelola operasional toko, pesanan WhatsApp, katalog produk, dan stok perangkat keras.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Pesanan Manual</span>
          </Link>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs tracking-wide transition-all cursor-pointer"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </Link>
        </div>
      </div>

      {/* Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Orders */}
        <Link
          href="/admin/orders"
          className="p-5 rounded-2xl bg-[#111827] border border-slate-800 hover:border-blue-500/50 transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pesanan Menunggu
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">
              {countersLoading ? "..." : counters?.pendingOrders ?? 0}
            </span>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 group-hover:text-blue-400 transition-colors">
              <span>Buka daftar pesanan</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </Link>

        {/* Low Stock */}
        <Link
          href="/admin/inventory"
          className="p-5 rounded-2xl bg-[#111827] border border-slate-800 hover:border-amber-500/50 transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Stok Menipis
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">
              {countersLoading ? "..." : counters?.lowStockVariants ?? 0}
            </span>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 group-hover:text-amber-400 transition-colors">
              <span>Kelola inventaris</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </Link>

        {/* Pending Reviews */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Ulasan Tertunda
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Star className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">
              {countersLoading ? "..." : counters?.pendingReviews ?? 0}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Menunggu moderasi staf
            </p>
          </div>
        </div>

        {/* Unread Messages */}
        <Link
          href="/admin/inbox"
          className="p-5 rounded-2xl bg-[#111827] border border-slate-800 hover:border-rose-500/50 transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pesan Baru
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">
              {countersLoading ? "..." : counters?.unreadMessages ?? 0}
            </span>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 group-hover:text-rose-400 transition-colors">
              <span>Buka kotak masuk</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </Link>
      </div>

      {/* Quick Shortcuts & Operational Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shortcuts */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#111827] border border-slate-800">
          <h2 className="text-base font-bold text-white mb-4">Akses Cepat Modul</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/admin/orders"
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 transition-all flex items-center gap-3.5"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Kelola Pesanan</p>
                <p className="text-xs text-slate-400">Status pembayaran & resi WhatsApp</p>
              </div>
            </Link>

            <Link
              href="/admin/inventory"
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 transition-all flex items-center gap-3.5"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Buku Besar Stok</p>
                <p className="text-xs text-slate-400">Mutasi & penyesuaian fisik opname</p>
              </div>
            </Link>

            <Link
              href="/admin/vouchers"
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 transition-all flex items-center gap-3.5"
            >
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                <TicketPercent className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Voucher Diskon</p>
                <p className="text-xs text-slate-400">Kode promo dan batas kuota</p>
              </div>
            </Link>

            <Link
              href="/admin/account"
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 transition-all flex items-center gap-3.5"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Keamanan Akun & 2FA</p>
                <p className="text-xs text-slate-400">Ubah sandi & Google Authenticator</p>
              </div>
            </Link>
          </div>
        </div>

        {/* System Health */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-4">Integritas Sistem</h2>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800/80">
                <span className="text-slate-400">Basis Data PostgreSQL 16</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aktif (Healthy)</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800/80">
                <span className="text-slate-400">Integrasi WhatsApp API</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Terkoneksi (+62)</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800/80">
                <span className="text-slate-400">Audit Logging</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Append-Only</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Peran Akun Aktif</span>
                <span className="text-amber-400 font-semibold uppercase">{user?.role}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
            Versi Kontrak API: v1.0.0 &bull; Zona Waktu: WIB (UTC+7)
          </div>
        </div>
      </div>
    </div>
  );
}
