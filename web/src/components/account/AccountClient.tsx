"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { UserProfile, OrderDetail, Address, ProductCard } from "@/types/api";
import { formatRupiah } from "@/config/site";
import { useCartStore } from "@/store/useCartStore";
import {
  User,
  Package,
  MapPin,
  Lock,
  Heart,
  LogOut,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

type AccountTab = "overview" | "orders" | "addresses" | "profile" | "security" | "wishlist";

export const AccountClient: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AccountTab>("overview");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlist, setWishlist] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms state
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState("");
  const [securityError, setSecurityError] = useState("");

  // Address modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addrRecipient, setAddrRecipient] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrCity, setAddrCity] = useState("Surabaya");
  const [addrProvince, setAddrProvince] = useState("Jawa Timur");
  const [addrPostal, setAddrPostal] = useState("");
  const [addrDefault, setAddrDefault] = useState(true);

  const { addItem } = useCartStore();

  useEffect(() => {
    let isSubscribed = true;

    async function fetchUserData() {
      try {
        const me = await api.getMe();
        if (!isSubscribed) return;
        setUser(me);
        setProfileName(me.name);
        setProfilePhone(me.phone);

        // Load orders & addresses & wishlist in parallel
        const [ordersRes, addressesRes, wishlistRes] = await Promise.allSettled([
          api.getMyOrders(),
          api.getAddresses(),
          api.getWishlist(),
        ]);

        if (!isSubscribed) return;

        if (ordersRes.status === "fulfilled") {
          setOrders((ordersRes.value as any).items || (ordersRes.value as any).orders || []);
        }
        if (addressesRes.status === "fulfilled") {
          setAddresses(addressesRes.value || []);
        }
        if (wishlistRes.status === "fulfilled") {
          setWishlist(wishlistRes.value || []);
        }
      } catch {
        if (!isSubscribed) return;
        router.push("/login?redirect=/account");
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    void fetchUserData();

    return () => {
      isSubscribed = false;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await api.logout();
    } finally {
      router.push("/login");
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");
    try {
      const updated = await api.updateMe({
        name: profileName.trim(),
        phone: profilePhone.trim(),
      });
      setUser(updated);
      setProfileSuccess("Profil berhasil diperbarui.");
    } catch (err: unknown) {
      const error = err as Error;
      setProfileError(error.message || "Gagal memperbarui profil.");
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecuritySuccess("");
    setSecurityError("");

    if (newPassword !== confirmPassword) {
      setSecurityError("Konfirmasi kata sandi baru tidak sesuai.");
      return;
    }
    if (newPassword.length < 8) {
      setSecurityError("Kata sandi baru minimal 8 karakter.");
      return;
    }

    try {
      await api.changePassword({
        currentPassword,
        newPassword,
      });
      setSecuritySuccess("Kata sandi berhasil diubah.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const error = err as Error;
      setSecurityError(error.message || "Gagal mengubah kata sandi.");
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newAddr = await api.createAddress({
        recipientName: addrRecipient.trim(),
        phone: addrPhone.trim(),
        street: addrStreet.trim(),
        city: addrCity.trim(),
        province: addrProvince.trim(),
        postalCode: addrPostal.trim(),
        isDefault: addrDefault,
      });
      setAddresses([...addresses, newAddr]);
      setShowAddressModal(false);
      setAddrRecipient("");
      setAddrPhone("");
      setAddrStreet("");
      setAddrPostal("");
    } catch {
      alert("Gagal menambahkan alamat baru.");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm("Hapus alamat ini dari buku alamat?")) return;
    try {
      await api.deleteAddress(id);
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch {
      alert("Gagal menghapus alamat.");
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await api.setDefaultAddress(id);
      setAddresses(
        addresses.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }))
      );
    } catch {
      alert("Gagal menyetel alamat utama.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#111111]" />
          <span className="text-xs uppercase tracking-wider text-[#8B877E]">Memuat Data Akun…</span>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "selesai":
        return "bg-emerald-50 text-[#2F6B3F] border-emerald-200";
      case "dikonfirmasi":
      case "diproses":
      case "siap_diambil":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "dibatalkan":
        return "bg-red-50 text-[#B3261E] border-red-200";
      default:
        return "bg-amber-50 text-amber-800 border-amber-200";
    }
  };

  const formatStatus = (s: string) => {
    switch (s) {
      case "menunggu_konfirmasi":
        return "Menunggu Konfirmasi";
      case "dikonfirmasi":
        return "Dikonfirmasi";
      case "diproses":
        return "Diproses";
      case "siap_diambil":
        return "Siap Diambil / Dikirim";
      case "selesai":
        return "Selesai";
      case "dibatalkan":
        return "Dibatalkan";
      default:
        return s;
    }
  };

  return (
    <div className="min-h-screen py-8 sm:py-12 border-b border-[#DAD6CC]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title & Welcome */}
        <div className="pb-8 border-b border-[#DAD6CC] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.16em] font-medium text-[#8B877E] block mb-1">
              Portal Pelanggan
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal text-[#111111] tracking-tight">
              Akun Saya
            </h1>
          </div>
          <p className="text-sm text-[#5F5C55]">
            Masuk sebagai <strong className="text-[#111111]">{user?.name}</strong> ({user?.email})
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-8">
          {/* Sidebar Tabs */}
          <aside className="lg:col-span-3">
            <nav className="bg-white/50 border border-[#DAD6CC] rounded-[2px] p-2 space-y-1">
              {[
                { id: "overview" as const, label: "Ringkasan", icon: User },
                { id: "orders" as const, label: "Riwayat Pesanan", icon: Package, badge: orders.length },
                { id: "addresses" as const, label: "Buku Alamat", icon: MapPin },
                { id: "wishlist" as const, label: "Wishlist", icon: Heart, badge: wishlist.length },
                { id: "profile" as const, label: "Data Profil", icon: User },
                { id: "security" as const, label: "Keamanan Sandi", icon: Lock },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative w-full flex items-center justify-between px-4 py-3 rounded-[2px] text-xs uppercase tracking-wider font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "text-white"
                        : "text-[#5F5C55] hover:bg-[#F2EFE8] hover:text-[#111111]"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-account-nav-pill"
                        transition={{ type: "spring", stiffness: 450, damping: 38 }}
                        className="absolute inset-0 bg-[#111111] rounded-[2px] -z-10 shadow-xs"
                      />
                    )}
                    <div className="relative z-10 flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <div className="relative z-10 flex items-center">
                      {item.badge !== undefined ? (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${
                            isActive ? "bg-white/20 text-white" : "bg-[#F2EFE8] text-[#5F5C55]"
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                      )}
                    </div>
                  </button>
                );
              })}

              <div className="pt-2 border-t border-[#DAD6CC]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-[2px] text-xs uppercase tracking-wider font-medium text-[#B3261E] hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </nav>
          </aside>

          {/* Main Tab Content */}
          <main className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* 1. Overview */}
                {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Greeting Card */}
                <div className="bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] p-6 sm:p-8">
                  <h2 className="text-2xl font-normal text-[#111111]">
                    Selamat Datang, {user?.name}
                  </h2>
                  <p className="text-sm text-[#5F5C55] mt-2 max-w-xl">
                    Melalui dashboard pelanggan GMC, Anda dapat memeriksa pembaruan status pesanan, melihat arsip nota transaksi, serta mengelola alamat pengantaran hardware IT Anda.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#DAD6CC]">
                    <div>
                      <span className="text-xs text-[#8B877E] uppercase tracking-wider block">
                        Total Pesanan
                      </span>
                      <span className="text-2xl font-bold text-[#111111] mt-1 block tabular-nums">
                        {orders.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-[#8B877E] uppercase tracking-wider block">
                        Alamat Tersimpan
                      </span>
                      <span className="text-2xl font-bold text-[#111111] mt-1 block tabular-nums">
                        {addresses.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-[#8B877E] uppercase tracking-wider block">
                        Wishlist
                      </span>
                      <span className="text-2xl font-bold text-[#111111] mt-1 block tabular-nums">
                        {wishlist.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Orders Preview */}
                <div className="bg-white/40 border border-[#DAD6CC] rounded-[2px] p-6 sm:p-8">
                  <div className="flex items-center justify-between pb-4 border-b border-[#DAD6CC]">
                    <h3 className="text-base font-medium text-[#111111]">Pesanan Terbaru</h3>
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="text-xs uppercase tracking-wider text-[#111111] underline hover:text-[#5F5C55]"
                    >
                      Lihat Semua ({orders.length})
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="py-8 text-center text-sm text-[#8B877E]">
                      Belum ada riwayat pesanan.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#DAD6CC]">
                      {orders.slice(0, 3).map((ord) => (
                        <div key={ord.orderNo} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <span className="text-xs font-mono font-bold text-[#111111]">
                              {ord.orderNo}
                            </span>
                            <span className="text-xs text-[#8B877E] block mt-0.5">
                              {new Date(ord.createdAt).toLocaleDateString("id-ID", {
                                dateStyle: "medium",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-[11px] font-medium px-2.5 py-1 rounded-full border uppercase tracking-wider ${getStatusBadge(
                                ord.status
                              )}`}
                            >
                              {formatStatus(ord.status)}
                            </span>
                            <span className="text-sm font-medium text-[#111111] tabular-nums">
                              {formatRupiah(ord.totalIdr)}
                            </span>
                            <Link
                              href={`/account/orders/${ord.orderNo}`}
                              className="text-xs font-medium text-[#111111] underline hover:text-[#5F5C55] ml-2"
                            >
                              Detail ›
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Riwayat Pesanan */}
            {activeTab === "orders" && (
              <div className="bg-white/40 border border-[#DAD6CC] rounded-[2px] p-6 sm:p-8">
                <h2 className="text-xl font-medium text-[#111111] pb-4 border-b border-[#DAD6CC]">
                  Riwayat Pesanan
                </h2>

                {orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="w-12 h-12 text-[#8B877E] mx-auto mb-3" strokeWidth={1.5} />
                    <p className="text-[#5F5C55] text-sm mb-4">
                      Anda belum pernah melakukan pemesanan.
                    </p>
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#000000] text-white rounded-full text-xs uppercase tracking-wider font-medium"
                    >
                      Mulai Belanja
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-[#DAD6CC] mt-2">
                    {orders.map((ord) => (
                      <div key={ord.orderNo} className="py-5 first:pt-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-mono font-bold text-[#111111]">
                                {ord.orderNo}
                              </span>
                              <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadge(
                                  ord.status
                                )}`}
                              >
                                {formatStatus(ord.status)}
                              </span>
                            </div>
                            <span className="text-xs text-[#8B877E] block mt-1">
                              Tanggal: {new Date(ord.createdAt).toLocaleDateString("id-ID", { dateStyle: "long" })}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-base font-medium text-[#111111] tabular-nums">
                              {formatRupiah(ord.totalIdr)}
                            </span>
                            <Link
                              href={`/account/orders/${ord.orderNo}`}
                              className="px-4 py-2 border border-[#DAD6CC] rounded-full text-xs uppercase tracking-wider font-medium text-[#111111] hover:bg-[#F2EFE8] transition-colors"
                            >
                              Lihat Rincian
                            </Link>
                          </div>
                        </div>

                        {/* Order preview items */}
                        <div className="mt-3 pl-3 border-l-2 border-[#DAD6CC] text-xs text-[#5F5C55] space-y-1">
                          {ord.items?.map((it: any, idx: number) => (
                            <div key={idx}>
                              <span className="tabular-nums">{it.quantity}x</span> {it.productName} (<span className="tabular-nums">{formatRupiah(it.priceIdr ?? 0)}</span>)
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Buku Alamat */}
            {activeTab === "addresses" && (
              <div className="bg-white/40 border border-[#DAD6CC] rounded-[2px] p-6 sm:p-8">
                <div className="flex items-center justify-between pb-4 border-b border-[#DAD6CC]">
                  <h2 className="text-xl font-medium text-[#111111]">Buku Alamat Pengiriman</h2>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#000000] text-white rounded-full text-xs uppercase tracking-wider font-medium hover:bg-black/85 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Alamat</span>
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="py-12 text-center text-[#5F5C55] text-sm">
                    Belum ada alamat tersimpan. Tambahkan alamat untuk memudahkan pengiriman pesanan berikutnya.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-5 rounded-[2px] border relative transition-all ${
                          addr.isDefault
                            ? "border-[#111111] bg-white ring-1 ring-black"
                            : "border-[#DAD6CC] bg-[#F2EFE8]/40"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-medium text-sm text-[#111111] block">
                              {addr.recipientName}
                            </span>
                            <span className="text-xs text-[#8B877E] font-mono block mt-0.5">
                              {addr.phone}
                            </span>
                          </div>
                          {addr.isDefault ? (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-green-50 text-[#2F6B3F] border border-green-200 rounded-[2px]">
                              Utama
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-xs text-[#5F5C55] hover:text-[#111111] underline cursor-pointer"
                            >
                              Jadikan Utama
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-[#5F5C55] mt-3 leading-relaxed">
                          {addr.street}
                          <br />
                          {addr.city}, {addr.province} {addr.postalCode}
                        </p>

                        <div className="mt-4 pt-3 border-t border-[#DAD6CC] flex justify-end">
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-xs text-[#B3261E] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. Wishlist */}
            {activeTab === "wishlist" && (
              <div className="bg-white/40 border border-[#DAD6CC] rounded-[2px] p-6 sm:p-8">
                <h2 className="text-xl font-medium text-[#111111] pb-4 border-b border-[#DAD6CC]">
                  Wishlist & Produk Tersimpan
                </h2>

                {wishlist.length === 0 ? (
                  <div className="py-12 text-center">
                    <Heart className="w-12 h-12 text-[#8B877E] mx-auto mb-3" strokeWidth={1.5} />
                    <p className="text-[#5F5C55] text-sm mb-4">
                      Belum ada produk yang disimpan di wishlist Anda.
                    </p>
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#000000] text-white rounded-full text-xs uppercase tracking-wider font-medium"
                    >
                      Jelajahi Katalog
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
                    {wishlist.map((item) => (
                      <div key={item.id} className="border border-[#DAD6CC] rounded-[2px] p-4 bg-white flex flex-col justify-between">
                        <div>
                          <div className="relative aspect-square bg-[#F2EFE8] rounded-[2px] mb-3">
                            <Image
                              src={item.primaryImageUrl || "/products/cpu-r7-7800x3d/1.svg"}
                              alt={item.name}
                              fill
                              className="object-contain p-2"
                              sizes="200px"
                            />
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-[#8B877E] font-medium block">
                            {typeof item.brand === "object" && item.brand !== null ? (item.brand as any).name : String(item.brand || "")}
                          </span>
                          <Link
                            href={`/shop/${item.slug}`}
                            className="text-sm font-medium text-[#111111] hover:underline line-clamp-2 mt-1"
                          >
                            {item.name}
                          </Link>
                          <span className="text-sm font-bold text-[#111111] block mt-2 tabular-nums">
                            {formatRupiah(item.minPriceIdr ?? 0)}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            addItem({
                              id: item.id,
                              productId: item.id,
                              slug: item.slug,
                              name: item.name,
                              brand: item.brand,
                              variantSku: item.slug,
                              variantName: "Default",
                              priceIdr: item.minPriceIdr,
                              maxStock: 99,
                              imageUrl: item.primaryImageUrl || "",
                            });
                          }}
                          className="w-full mt-4 py-2.5 bg-[#000000] text-white rounded-full text-xs uppercase tracking-wider font-medium hover:bg-black/85 transition-colors cursor-pointer"
                        >
                          + Keranjang
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. Profil */}
            {activeTab === "profile" && (
              <div className="bg-white/40 border border-[#DAD6CC] rounded-[2px] p-6 sm:p-8">
                <h2 className="text-xl font-medium text-[#111111] pb-4 border-b border-[#DAD6CC]">
                  Data Profil
                </h2>

                {profileSuccess && (
                  <div className="my-4 p-3.5 bg-green-50 border border-green-200 text-[#2F6B3F] text-xs rounded-[2px] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}
                {profileError && (
                  <div className="my-4 p-3.5 bg-red-50 border border-red-200 text-[#B3261E] text-xs rounded-[2px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md mt-6">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-medium text-[#111111] mb-1.5">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-4 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-medium text-[#111111] mb-1.5">
                      Alamat Email (Tidak dapat diubah)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ""}
                      className="w-full bg-[#F2EFE8]/50 border border-[#DAD6CC] rounded-[2px] px-4 py-2.5 text-sm text-[#8B877E] cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-medium text-[#111111] mb-1.5">
                      Nomor WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-4 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-8 py-3 bg-[#000000] text-white rounded-full text-xs uppercase tracking-wider font-medium hover:bg-black/85 transition-colors cursor-pointer mt-2"
                  >
                    Simpan Perubahan
                  </button>
                </form>
              </div>
            )}

            {/* 6. Keamanan Sandi */}
            {activeTab === "security" && (
              <div className="bg-white/40 border border-[#DAD6CC] rounded-[2px] p-6 sm:p-8">
                <h2 className="text-xl font-medium text-[#111111] pb-4 border-b border-[#DAD6CC]">
                  Ubah Kata Sandi
                </h2>

                {securitySuccess && (
                  <div className="my-4 p-3.5 bg-green-50 border border-green-200 text-[#2F6B3F] text-xs rounded-[2px] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{securitySuccess}</span>
                  </div>
                )}
                {securityError && (
                  <div className="my-4 p-3.5 bg-red-50 border border-red-200 text-[#B3261E] text-xs rounded-[2px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{securityError}</span>
                  </div>
                )}

                <form onSubmit={handleSecuritySubmit} className="space-y-4 max-w-md mt-6">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-medium text-[#111111] mb-1.5">
                      Kata Sandi Saat Ini
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-4 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-medium text-[#111111] mb-1.5">
                      Kata Sandi Baru (Minimal 8 Karakter)
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-4 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-medium text-[#111111] mb-1.5">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-4 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-8 py-3 bg-[#000000] text-white rounded-full text-xs uppercase tracking-wider font-medium hover:bg-black/85 transition-colors cursor-pointer mt-2"
                  >
                    Perbarui Kata Sandi
                  </button>
                </form>
              </div>
            )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Add Address Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-[#FBF7EF] border border-[#DAD6CC] rounded-[2px] p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
            >
              <h3 className="text-xl font-medium text-[#111111] mb-4 pb-3 border-b border-[#DAD6CC]">
                Tambah Alamat Pengiriman
              </h3>

            <form onSubmit={handleAddAddress} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-[#111111] mb-1.5">
                    Nama Penerima
                  </label>
                  <input
                    type="text"
                    required
                    value={addrRecipient}
                    onChange={(e) => setAddrRecipient(e.target.value)}
                    className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-3 py-2 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-[#111111] mb-1.5">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    required
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-3 py-2 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-[#111111] mb-1.5">
                  Alamat Lengkap (Jalan, No. Rumah, RT/RW)
                </label>
                <textarea
                  rows={2}
                  required
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] p-3 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-[#111111] mb-1.5">
                    Kota / Kab
                  </label>
                  <input
                    type="text"
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-3 py-2 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-[#111111] mb-1.5">
                    Provinsi
                  </label>
                  <input
                    type="text"
                    required
                    value={addrProvince}
                    onChange={(e) => setAddrProvince(e.target.value)}
                    className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-3 py-2 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-[#111111] mb-1.5">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    value={addrPostal}
                    onChange={(e) => setAddrPostal(e.target.value)}
                    className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-3 py-2 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#5F5C55] pt-1">
                <input
                  type="checkbox"
                  checked={addrDefault}
                  onChange={(e) => setAddrDefault(e.target.checked)}
                  className="rounded border-[#DAD6CC] text-black accent-black"
                />
                <span>Jadikan sebagai alamat pengiriman utama</span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#DAD6CC]">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-6 py-2.5 border border-[#DAD6CC] rounded-full text-xs uppercase tracking-wider text-[#5F5C55] hover:bg-[#F2EFE8]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#000000] text-white rounded-full text-xs uppercase tracking-wider font-medium hover:bg-black/85"
                >
                  Simpan Alamat
                </button>
              </div>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
