"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  FolderTree,
  Tag,
  Users,
  TicketPercent,
  FileText,
  Mail,
  BarChart3,
  Settings,
  History,
  User,
  LogOut,
  Search,
} from "lucide-react";
import { useAdminLogoutMutation } from "@/lib/api/hooks/useAdminApi";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const logoutMutation = useAdminLogoutMutation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  const handleLogout = async () => {
    onOpenChange(false);
    await logoutMutation.mutateAsync();
    router.push("/admin/login");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 p-4">
      <div
        className="fixed inset-0"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-xl bg-[#131B2E] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in-0 zoom-in-95 duration-100">
        <Command className="w-full bg-transparent text-slate-100">
          <div className="flex items-center border-b border-slate-800 px-4">
            <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Cari navigasi, halaman, atau perintah..."
              className="w-full bg-transparent py-4 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 space-y-1">
            <Command.Empty className="py-6 text-center text-sm text-slate-500">
              Tidak ada hasil yang ditemukan.
            </Command.Empty>

            <Command.Group heading="Navigasi Menu" className="text-xs font-semibold text-slate-500 px-2 py-1.5 uppercase tracking-wider">
              <Command.Item
                onSelect={() => handleSelect("/admin")}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-amber-500" />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect("/admin/orders")}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-blue-400" />
                <span>Pesanan Toko</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect("/admin/products")}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors"
              >
                <Package className="w-4 h-4 text-emerald-400" />
                <span>Katalog Produk</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect("/admin/inventory")}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors"
              >
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Inventaris & Stok</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect("/admin/categories")}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors"
              >
                <FolderTree className="w-4 h-4 text-cyan-400" />
                <span>Kategori</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect("/admin/brands")}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors"
              >
                <Tag className="w-4 h-4 text-amber-400" />
                <span>Merek / Brand</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect("/admin/customers")}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors"
              >
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Pelanggan</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect("/admin/vouchers")}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors"
              >
                <TicketPercent className="w-4 h-4 text-rose-400" />
                <span>Voucher Promosi</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect("/admin/content")}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors"
              >
                <FileText className="w-4 h-4 text-yellow-400" />
                <span>Manajemen Konten</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect("/admin/inbox")}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors"
              >
                <Mail className="w-4 h-4 text-sky-400" />
                <span>Kotak Masuk Pesan</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect("/admin/reports")}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-orange-400" />
                <span>Laporan Penjualan</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect("/admin/settings")}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Pengaturan Toko</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect("/admin/audit")}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors"
              >
                <History className="w-4 h-4 text-emerald-400" />
                <span>Log Audit Sistem</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Akun & Sesi" className="text-xs font-semibold text-slate-500 px-2 py-1.5 uppercase tracking-wider">
              <Command.Item
                onSelect={() => handleSelect("/admin/account")}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors"
              >
                <User className="w-4 h-4 text-slate-300" />
                <span>Pengaturan Akun & Keamanan (2FA)</span>
              </Command.Item>
              <Command.Item
                onSelect={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Keluar dari Akun</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="border-t border-slate-800 px-4 py-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">ESC</kbd> untuk menutup</span>
            <span>GMC Back-Office</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
