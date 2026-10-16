"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { siteConfig, formatRupiah } from "@/config/site";
import { api } from "@/lib/api";
import { useIsMounted } from "@/hooks/useIsMounted";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Truck,
  ShieldCheck,
  CreditCard,
  Building2,
  Banknote,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export const CheckoutClient: React.FC = () => {
  const router = useRouter();
  const isMounted = useIsMounted();
  const { items, orderNote, clearCart, subtotalIdr, totalCount } = useCartStore();

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");

  // Shipping details (if delivery)
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Surabaya");
  const [province, setProvince] = useState("Jawa Timur");
  const [postalCode, setPostalCode] = useState("");

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "cod" | "store_payment">("bank_transfer");
  const [note, setNote] = useState(orderNote || "");
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isMounted) {
    return (
      <div className="min-h-[70vh] max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-pulse">
        <div className="h-10 w-48 bg-[#DAD6CC]/40 rounded-[2px] mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 h-96 bg-[#F2EFE8] rounded-[2px]" />
          <div className="lg:col-span-5 h-96 bg-[#F2EFE8] rounded-[2px]" />
        </div>
      </div>
    );
  }

  const subtotal = subtotalIdr();
  const count = totalCount();

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-[#F2EFE8] border border-[#DAD6CC] flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-[#5F5C55]" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-light text-[#111111] mb-3">
          Keranjang belanja Anda kosong
        </h1>
        <p className="text-[#5F5C55] text-sm max-w-md mb-8">
          Silakan pilih produk dari katalog kami terlebih dahulu sebelum melakukan proses checkout.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#000000] text-white rounded-full micro-label text-xs tracking-widest hover:bg-black/85 transition-colors cursor-pointer"
        >
          <span>Kembali ke Katalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validation
    if (!customerName.trim()) {
      setErrorMsg("Nama lengkap pemesan wajib diisi.");
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, "").length < 9) {
      setErrorMsg("Nomor WhatsApp aktif wajib diisi (minimal 9 digit).");
      return;
    }
    if (deliveryMethod === "delivery") {
      if (!street.trim() || !city.trim() || !province.trim()) {
        setErrorMsg("Alamat pengiriman lengkap (Jalan/No/RT/RW, Kota, Provinsi) wajib diisi untuk opsi kirim.");
        return;
      }
    }
    if (!agreeTerms) {
      setErrorMsg("Anda harus menyetujui syarat & ketentuan pemesanan.");
      return;
    }

    setIsSubmitting(true);

    try {
      const idempotencyKey = crypto.randomUUID();
      const payload: any = {
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim() || `${customerPhone.trim()}@guest.gmc.com`,
        },
        deliveryMethod,
        shippingAddress:
          deliveryMethod === "delivery"
            ? {
                recipientName: recipientName.trim() || customerName.trim(),
                phone: recipientPhone.trim() || customerPhone.trim(),
                street: street.trim(),
                city: city.trim(),
                province: province.trim(),
                postalCode: postalCode.trim() || "60111",
              }
            : undefined,
        paymentMethod: paymentMethod === "store_payment" ? "pay_at_store" : paymentMethod,
        note: note.trim() || null,
        expectedSubtotalIdr: subtotal,
        items: items.map((i) => ({
          variantId: i.variantId || i.id,
          quantity: i.quantity,
        })),
      };

      const res = await api.checkout(payload, idempotencyKey);

      // Save view token for guest
      if (res.viewToken && typeof window !== "undefined") {
        localStorage.setItem(`gmc_view_token_${res.order.orderNo}`, res.viewToken);
      }

      // Save order details to sessionStorage for fast rendering on success page
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `gmc_order_${res.order.orderNo}`,
          JSON.stringify({
            orderNo: res.order.orderNo,
            totalIdr: res.order.totalIdr,
            whatsappUrl: res.order.whatsappUrl,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerEmail: customerEmail.trim(),
            deliveryMethod,
            paymentMethod,
            items,
            createdAt: res.order.createdAt,
          })
        );
      }

      // Clear Cart
      clearCart();

      // Redirect to success
      const tokenParam = res.viewToken ? `?token=${encodeURIComponent(res.viewToken)}` : "";
      router.push(`/checkout/success/${res.order.orderNo}${tokenParam}`);
    } catch (err: unknown) {
      const error = err as any;
      if (error?.code === "price_changed") {
        useCartStore.getState().validateWithServer();
        setErrorMsg("Harga produk telah diperbarui dari sistem pusat. Silakan periksa kembali total pesanan Anda.");
      } else {
        setErrorMsg(
          error?.message || "Terjadi kesalahan saat memproses pesanan. Silakan coba lagi atau hubungi WhatsApp kami."
        );
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-8 sm:py-12 border-b border-[#DAD6CC] bg-[var(--bg)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="pb-8 border-b border-[#DAD6CC]">
          <span className="micro-label text-[var(--ink-3)] block mb-1 tracking-widest">
            KONFIRMASI PESANAN
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-[#111111] tracking-tight">
            Checkout Pesanan
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mt-10">
          {/* Form Fields (Left) */}
          <div className="lg:col-span-7 space-y-10">
            {errorMsg && (
              <div className="p-4 rounded-[2px] bg-red-50 border border-red-200 text-[#B3261E] text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Periksa kembali data formulir:</p>
                  <p className="mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Step 1: Data Pemesan */}
            <section className="bg-white/40 p-6 sm:p-8 rounded-[2px] border border-[#DAD6CC]">
              <div className="flex items-center gap-3 pb-5 border-b border-[#DAD6CC]">
                <div className="w-7 h-7 rounded-full bg-[#111111] text-white text-xs font-medium flex items-center justify-center">
                  1
                </div>
                <h2 className="text-lg font-normal text-[#111111]">Data Pemesan & Kontak</h2>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="micro-label text-[#111111] block mb-2">
                    NAMA LENGKAP <span className="text-[#B3261E]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-4 py-3 text-sm text-[#111111] placeholder-[#8B877E] focus:outline-none focus:border-[#111111]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="micro-label text-[#111111] block mb-2">
                      NOMOR WHATSAPP <span className="text-[#B3261E]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-4 py-3 text-sm text-[#111111] placeholder-[#8B877E] focus:outline-none focus:border-[#111111]"
                    />
                    <span className="text-[11px] text-[#8B877E] mt-1 block">
                      Admin akan konfirmasi pesanan ke nomor ini.
                    </span>
                  </div>

                  <div>
                    <label className="micro-label text-[#111111] block mb-2">
                      EMAIL <span className="text-[#8B877E] font-normal">(OPSIONAL)</span>
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="budi@example.com"
                      spellCheck={false}
                      className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-4 py-3 text-sm text-[#111111] placeholder-[#8B877E] focus:outline-none focus:border-[#111111]"
                    />
                    <span className="text-[11px] text-[#8B877E] mt-1 block">
                      Untuk salinan invoice dan riwayat akun.
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 2: Metode Pengambilan / Pengiriman */}
            <section className="bg-white/40 p-6 sm:p-8 rounded-[2px] border border-[#DAD6CC]">
              <div className="flex items-center gap-3 pb-5 border-b border-[#DAD6CC]">
                <div className="w-7 h-7 rounded-full bg-[#111111] text-white text-xs font-medium flex items-center justify-center">
                  2
                </div>
                <h2 className="text-lg font-normal text-[#111111]">Metode Pengambilan & Pengiriman</h2>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Store Pickup Option */}
                <label
                  className={`relative p-5 rounded-[2px] border cursor-pointer transition-all ${
                    deliveryMethod === "pickup"
                      ? "border-[#111111] bg-white ring-1 ring-black"
                      : "border-[#DAD6CC] bg-[#F2EFE8]/50 hover:bg-[#F2EFE8]"
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="pickup"
                    checked={deliveryMethod === "pickup"}
                    onChange={() => setDeliveryMethod("pickup")}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="w-5 h-5 text-[#111111]" />
                      <span className="text-sm font-medium text-[#111111]">Ambil di Toko</span>
                    </div>
                    <span className="text-xs font-medium text-[#2F6B3F] bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      GRATIS (Rp 0)
                    </span>
                  </div>
                  <p className="text-xs text-[#5F5C55] mt-3 leading-relaxed">
                    Ambil langsung di ITC Mega Grosir Surabaya. Bisa langsung dites di tempat bersama teknisi.
                  </p>
                </label>

                {/* Delivery Option */}
                <label
                  className={`relative p-5 rounded-[2px] border cursor-pointer transition-all ${
                    deliveryMethod === "delivery"
                      ? "border-[#111111] bg-white ring-1 ring-black"
                      : "border-[#DAD6CC] bg-[#F2EFE8]/50 hover:bg-[#F2EFE8]"
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="delivery"
                    checked={deliveryMethod === "delivery"}
                    onChange={() => setDeliveryMethod("delivery")}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-[#111111]" />
                      <span className="text-sm font-medium text-[#111111]">Kirim ke Alamat</span>
                    </div>
                    <span className="text-xs font-medium text-[#8B877E]">
                      Konfirmasi WA
                    </span>
                  </div>
                  <p className="text-xs text-[#5F5C55] mt-3 leading-relaxed">
                    Kirim via Gojek / Grab Instant (Surabaya) atau ekspedisi JNE/J&T/Sicepat dengan packing kayu aman.
                  </p>
                </label>
              </div>

              {/* Conditional Pickup Details / Delivery Form with smooth accordion */}
              <AnimatePresence mode="wait">
                {deliveryMethod === "pickup" ? (
                  <motion.div
                    key="pickup"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 p-4 rounded-[2px] bg-[#F2EFE8] border border-[#DAD6CC] text-xs text-[#5F5C55] space-y-1.5">
                      <p className="font-medium text-[#111111] flex items-center gap-2">
                        <Store className="w-4 h-4 text-[#2F6B3F]" />
                        Lokasi Pengambilan:
                      </p>
                      <p className="pl-6 font-mono text-[#111111]">{siteConfig.contact.address}</p>
                      <p className="pl-6 text-[#8B877E]">
                        Jam buka: {siteConfig.contact.openingHours}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="delivery"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 pt-6 border-t border-[#DAD6CC] space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="micro-label text-[#111111] block mb-2">
                            NAMA PENERIMA PAKET
                          </label>
                          <input
                            type="text"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            placeholder={customerName || "Nama penerima di lokasi"}
                            className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-4 py-2.5 text-sm text-[#111111] placeholder-[#8B877E] focus:outline-none focus:border-[#111111]"
                          />
                        </div>
                        <div>
                          <label className="micro-label text-[#111111] block mb-2">
                            NOMOR TELEPON PENERIMA
                          </label>
                          <input
                            type="tel"
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value)}
                            placeholder={customerPhone || "08xxxxxxxxxx"}
                            className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-4 py-2.5 text-sm text-[#111111] placeholder-[#8B877E] focus:outline-none focus:border-[#111111]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="micro-label text-[#111111] block mb-2">
                          ALAMAT LENGKAP (JALAN, NO. RUMAH, RT/RW, PATOKAN) <span className="text-[#B3261E]">*</span>
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="Contoh: Jl. Dharmahusada Indah Timur No. 12, Kel. Mulyorejo"
                          className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] p-3 text-sm text-[#111111] placeholder-[#8B877E] focus:outline-none focus:border-[#111111] resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="micro-label text-[#111111] block mb-2">
                            KOTA / KABUPATEN <span className="text-[#B3261E]">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-4 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                          />
                        </div>
                        <div>
                          <label className="micro-label text-[#111111] block mb-2">
                            PROVINSI <span className="text-[#B3261E]">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={province}
                            onChange={(e) => setProvince(e.target.value)}
                            className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-4 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                          />
                        </div>
                        <div>
                          <label className="micro-label text-[#111111] block mb-2">
                            KODE POS
                          </label>
                          <input
                            type="text"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            placeholder="60115"
                            className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] px-4 py-2.5 text-sm text-[#111111] placeholder-[#8B877E] focus:outline-none focus:border-[#111111]"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Step 3: Metode Pembayaran */}
            <section className="bg-white/40 p-6 sm:p-8 rounded-[2px] border border-[#DAD6CC]">
              <div className="flex items-center gap-3 pb-5 border-b border-[#DAD6CC]">
                <div className="w-7 h-7 rounded-full bg-[#111111] text-white text-xs font-medium flex items-center justify-center">
                  3
                </div>
                <h2 className="text-lg font-normal text-[#111111]">Metode Pembayaran</h2>
              </div>

              <div className="mt-4 p-4 rounded-[2px] bg-[#F2EFE8] border border-[#DAD6CC] text-xs text-[#5F5C55] leading-relaxed">
                <strong>Informasi Pembayaran:</strong> Transaksi di GMC menggunakan konfirmasi via WhatsApp. Anda tidak perlu memasukkan informasi kartu kredit di website. No. rekening resmi (BCA / Mandiri) atau QRIS akan diberikan admin saat memvalidasi ketersediaan stok fisik.
              </div>

              <div className="mt-5 space-y-3">
                <label
                  className={`p-4 rounded-[2px] border cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === "bank_transfer"
                      ? "border-[#111111] bg-white ring-1 ring-black"
                      : "border-[#DAD6CC] bg-[#F2EFE8]/50 hover:bg-[#F2EFE8]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-[#111111]" />
                    <div>
                      <span className="text-sm font-medium text-[#111111] block">
                        Transfer Bank (BCA / Mandiri / BRI)
                      </span>
                      <span className="text-xs text-[#5F5C55]">
                        Instruksi transfer & no. rekening dikirimkan saat konfirmasi WhatsApp.
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={paymentMethod === "bank_transfer"}
                    onChange={() => setPaymentMethod("bank_transfer")}
                    className="w-4 h-4 text-[#111111] accent-black"
                  />
                </label>

                <label
                  className={`p-4 rounded-[2px] border cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === "store_payment"
                      ? "border-[#111111] bg-white ring-1 ring-black"
                      : "border-[#DAD6CC] bg-[#F2EFE8]/50 hover:bg-[#F2EFE8]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-[#111111]" />
                    <div>
                      <span className="text-sm font-medium text-[#111111] block">
                        Bayar di Toko (Saat Ambil Barang)
                      </span>
                      <span className="text-xs text-[#5F5C55]">
                        Bisa bayar tunai, Debit BCA/Mandiri, atau scan QRIS langsung di kasir toko GMC.
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="store_payment"
                    checked={paymentMethod === "store_payment"}
                    onChange={() => setPaymentMethod("store_payment")}
                    className="w-4 h-4 text-[#111111] accent-black"
                  />
                </label>

                <label
                  className={`p-4 rounded-[2px] border cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === "cod"
                      ? "border-[#111111] bg-white ring-1 ring-black"
                      : "border-[#DAD6CC] bg-[#F2EFE8]/50 hover:bg-[#F2EFE8]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Banknote className="w-5 h-5 text-[#111111]" />
                    <div>
                      <span className="text-sm font-medium text-[#111111] block">
                        Cash On Delivery (COD Surabaya)
                      </span>
                      <span className="text-xs text-[#5F5C55]">
                        Khusus pengiriman kurir instan Surabaya. Pembayaran tunai saat kurir tiba.
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="w-4 h-4 text-[#111111] accent-black"
                  />
                </label>
              </div>
            </section>

            {/* Step 4: Catatan Pesanan */}
            <section className="bg-white/40 p-6 sm:p-8 rounded-[2px] border border-[#DAD6CC]">
              <div className="flex items-center gap-3 pb-5 border-b border-[#DAD6CC]">
                <div className="w-7 h-7 rounded-full bg-[#111111] text-white text-xs font-medium flex items-center justify-center">
                  4
                </div>
                <h2 className="text-lg font-normal text-[#111111]">Catatan Khusus untuk Toko</h2>
              </div>

              <div className="mt-5">
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Contoh: Tolong update BIOS ke versi terbaru sebelum diambil / Request kirim hari Jumat sore."
                  className="w-full bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] p-3 text-sm text-[#111111] placeholder-[#8B877E] focus:outline-none focus:border-[#111111] resize-none"
                />
              </div>
            </section>

            {/* Terms and Submission */}
            <div className="pt-2 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer text-sm text-[#5F5C55]">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded-[2px] border-[#DAD6CC] text-black accent-black"
                />
                <span>
                  Saya menyetujui bahwa pesanan ini akan diteruskan ke WhatsApp resmi Global Mandiri Computer untuk konfirmasi ketersediaan barang dan penyelesaian transaksi.
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-[#000000] text-white rounded-full flex items-center justify-center gap-3 micro-label text-xs tracking-widest hover:bg-black/85 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memproses Pesanan…</span>
                  </>
                ) : (
                  <>
                    <span>KIRIM PESANAN & KONFIRMASI WHATSAPP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sticky Summary (Right) */}
          <div className="lg:col-span-5">
            <div className="bg-[#F2EFE8] border border-[#DAD6CC] rounded-[2px] p-6 sm:p-8 sticky top-28">
              <div className="flex items-center justify-between pb-4 border-b border-[#DAD6CC]">
                <h2 className="text-lg font-normal text-[#111111]">Rincian Pesanan</h2>
                <Link
                  href="/cart"
                  className="text-xs uppercase tracking-wider text-[#5F5C55] hover:text-[#111111] underline"
                >
                  Edit Keranjang
                </Link>
              </div>

              {/* Items List */}
              <div className="py-4 space-y-4 max-h-[360px] overflow-y-auto divide-y divide-[#DAD6CC]">
                {items.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-start gap-4">
                    <div className="relative w-14 h-14 bg-white rounded-[2px] border border-[#DAD6CC] shrink-0 overflow-hidden">
                      <Image
                        src={item.imageUrl || "/products/cpu-r7-7800x3d/1.svg"}
                        alt={item.name}
                        fill
                        className="object-contain p-1"
                        sizes="56px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-normal text-[#111111] line-clamp-1">
                        {item.name}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-[#5F5C55] mt-1 tabular-nums">
                        <span>{item.quantity} x {formatRupiah(item.priceIdr)}</span>
                        <span className="font-medium text-[#111111]">
                          {formatRupiah(item.priceIdr * item.quantity)}
                        </span>
                      </div>
                      {item.variantName && item.variantName !== "Default" && (
                        <span className="text-[11px] text-[#8B877E] block mt-0.5">
                          {item.variantName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown */}
              <div className="py-4 space-y-2.5 text-sm border-t border-b border-[#DAD6CC]">
                <div className="flex justify-between text-[#5F5C55]">
                  <span>Subtotal ({count} barang)</span>
                  <span className="text-[#111111] font-medium tabular-nums">{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#5F5C55]">
                  <span>Biaya Pengiriman</span>
                  <span className="text-[#2F6B3F] font-medium text-xs">
                    {deliveryMethod === "pickup" ? "Gratis (Ambil di Toko)" : "Dikonfirmasi via WA"}
                  </span>
                </div>
              </div>

              <div className="py-4 flex justify-between items-baseline">
                <span className="text-base font-normal text-[#111111]">Total Transaksi</span>
                <span className="text-2xl font-medium text-[#111111] tracking-tight tabular-nums">
                  {formatRupiah(subtotal)}
                </span>
              </div>

              {/* Info / Safety badges */}
              <div className="mt-4 pt-4 border-t border-[#DAD6CC] space-y-2.5 text-xs text-[#5F5C55]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2F6B3F] shrink-0" />
                  <span>Stok diperiksa langsung di toko fisik ITC Mega Grosir</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2F6B3F] shrink-0" />
                  <span>Garansi Resmi & Nota Toko Lengkap</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
