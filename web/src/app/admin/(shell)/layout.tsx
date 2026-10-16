"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useAdminMe,
  useAdminCounters,
  useAdminLogoutMutation,
} from "@/lib/api/hooks/useAdminApi";
import { CommandPalette } from "@/admin/components/CommandPalette";
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
  ShieldAlert,
  Search,
  LogOut,
  User,
  Loader2,
  Menu,
  X,
  Lock,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badgeKey?: "pendingOrders" | "lowStockVariants" | "unreadMessages";
  badgeColor?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Pesanan", href: "/admin/orders", icon: ShoppingBag, badgeKey: "pendingOrders", badgeColor: "bg-blue-500" },
  { label: "Produk", href: "/admin/products", icon: Package },
  { label: "Inventaris", href: "/admin/inventory", icon: Layers, badgeKey: "lowStockVariants", badgeColor: "bg-amber-500" },
  { label: "Kategori", href: "/admin/categories", icon: FolderTree },
  { label: "Merek", href: "/admin/brands", icon: Tag },
  { label: "Pelanggan", href: "/admin/customers", icon: Users },
  { label: "Voucher", href: "/admin/vouchers", icon: TicketPercent },
  { label: "Konten", href: "/admin/content", icon: FileText },
  { label: "Pesan", href: "/admin/inbox", icon: Mail, badgeKey: "unreadMessages", badgeColor: "bg-rose-500" },
  { label: "Laporan", href: "/admin/reports", icon: BarChart3 },
  { label: "Pengaturan", href: "/admin/settings", icon: Settings },
  { label: "Log Audit", href: "/admin/audit", icon: History },
];

export default function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: adminUser, isLoading, isError } = useAdminMe();
  const { data: counters } = useAdminCounters();
  const logoutMutation = useAdminLogoutMutation();

  useEffect(() => {
    if (!isLoading && (!adminUser || isError)) {
      router.replace("/admin/login");
    }
  }, [adminUser, isLoading, isError, router]);

  useEffect(() => {
    if (adminUser?.mustChangePassword && pathname !== "/admin/account") {
      router.replace("/admin/account?force=password");
    }
  }, [adminUser, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-sm font-medium">Memuat GMC Back-Office...</span>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace("/admin/login");
  };

  return (
    <div className="min-h-screen flex bg-[#0B0F19] text-slate-100">
      {/* Command Palette */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#111827] border-r border-slate-800 shrink-0">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold">
            G
          </div>
          <div>
            <span className="font-bold text-sm text-white tracking-wide">GMC Back-Office</span>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Internal Admin</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const badgeCount = item.badgeKey && counters ? counters[item.badgeKey] : 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {badgeCount > 0 && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full text-white ${
                      item.badgeColor || "bg-slate-700"
                    }`}
                  >
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <Link href="/admin/account" className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{adminUser.name}</p>
                <span className="inline-block text-[10px] uppercase font-bold text-amber-400">
                  {adminUser.role === "admin" ? "Pemilik (Admin)" : "Staf Operasional"}
                </span>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              title="Keluar"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-[#111827]/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Quick ⌘K button */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all text-xs cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Cari menu atau perintah...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono border border-slate-700 text-slate-300">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {adminUser.mustChangePassword && (
              <Link
                href="/admin/account?force=password"
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium rounded-lg animate-pulse"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Wajib Ubah Kata Sandi</span>
              </Link>
            )}

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 hidden sm:inline">
                {adminUser.email}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider bg-slate-800 text-amber-400 border border-slate-700">
                {adminUser.role}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#111827] border-b border-slate-800 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const badgeCount = item.badgeKey && counters ? counters[item.badgeKey] : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium ${
                    isActive
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {badgeCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-white">
                      {badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
