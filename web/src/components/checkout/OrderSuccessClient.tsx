"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { siteConfig, formatRupiah } from "@/config/site";
import { api } from "@/lib/api";
import { OrderDetail } from "@/types/api";
import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  MessageCircle,
  Printer,
  ShoppingBag,
  Store,
  Truck,
  Copy,
  Check,
  Building2,
  Clock,
} from "lucide-react";

interface OrderSuccessClientProps {
  orderNo: string;
}

export const OrderSuccessClient: React.FC<OrderSuccessClientProps> = ({ orderNo }) => {
  const [order, setOrder] = useState<OrderDetail | null>(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(`gmc_order_${orderNo}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          interface CachedItem {
            name: string;
            variantSku: string;
            variantName?: string;
            priceIdr: number;
            quantity: number;
            imageUrl?: string;
          }
          return {
            orderNo: parsed.orderNo,
            customerName: parsed.customerName,
            customerPhone: parsed.customerPhone,
            customerEmail: parsed.customerEmail,
            deliveryMethod: parsed.deliveryMethod,
            paymentMethod: parsed.paymentMethod,
            note: parsed.note,
            subtotalIdr: parsed.totalIdr,
            shippingIdr: 0,
            totalIdr: parsed.totalIdr,
            status: "menunggu_konfirmasi",
            createdAt: parsed.createdAt,
            items: (parsed.items || []).map((i: CachedItem) => ({
              productName: i.name,
              variantSku: i.variantSku,
              optionsSummary: i.variantName,
              priceIdr: i.priceIdr,
              quantity: i.quantity,
              imageUrl: i.imageUrl,
            })),
            statusHistory: [],
          };
        } catch {}
      }
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem(`gmc_order_${orderNo}`);
    }
    return true;
  });
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let token: string | null = null;
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      token = urlParams.get("token") || localStorage.getItem(`gmc_view_token_${orderNo}`);
    }

    // Fetch from authoritative API
    api
      .getOrder(orderNo, token || undefined)
      .then((data: any) => {
        setOrder(data);
      })
      .catch(() => {
        // Fallback to cached session
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderNo]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(key);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const defaultWaUrl = () => {
    if (order?.whatsappUrl) {
      return order.whatsappUrl;
    }

    const totalText = order ? formatRupiah(order.totalIdr) : "Rp 0";
    const nameText = order ? order.customerName : "Pelanggan";
    const methodText =
      order?.deliveryMethod === "delivery"
        ? "Kirim ke Alamat"
        : "Ambil di Toko (ITC Mega Grosir Surabaya)";

    const message = `Halo Admin GMC Surabaya, saya ingin konfirmasi pesanan dengan nomor *${orderNo}*:
- Nama: ${nameText}
- Total: ${totalText}
- Metode: ${methodText}

Mohon info ketersediaan stok fisik dan instruksi pembayarannya. Terima kasih!`;

    return `https://wa.me/6282232554674?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="min-h-screen py-10 sm:py-16 border-b border-[#DAD6CC] bg-[var(--bg)] print:py-0 print:border-none">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Print Only Header */}
        <div className="hidden print:block mb-8 pb-4 border-b border-black">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">GLOBAL MANDIRI COMPUTER</h1>
              <p className="text-xs text-neutral-600 mt-1">{siteConfig.contact.address}</p>
              <p className="text-xs text-neutral-600">WhatsApp: {siteConfig.contact.phone}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono uppercase block text-neutral-500">FAKTUR / INVOICE</span>
              <span className="text-lg font-mono font-bold">{orderNo}</span>
              <p className="text-xs text-neutral-600 mt-1">
                {order ? new Date(order.createdAt).toLocaleDateString("id-ID", { dateStyle: "long" }) : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Screen Celebratory Header */}
        <div className="text-center pb-10 border-b border-[#DAD6CC] print:hidden">
          <motion.div
            initial={shouldReduceMotion ? { scale: 1 } : { scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-[#2F6B3F] mb-4 shadow-sm"
          >
            <CheckCircle2 className="w-9 h-9" />
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="micro-label text-[#2F6B3F] block mb-2 tracking-widest font-medium">
              PESANAN BERHASIL DIBUAT
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-[#111111] tracking-tight">
              Terima Kasih atas Pesanan Anda
            </h1>
            <p className="text-[#5F5C55] text-base max-w-lg mx-auto mt-3">
              Nomor referensi pesanan Anda telah dicatat. Silakan lakukan konfirmasi ke admin WhatsApp kami untuk validasi stok fisik dan penyelesaian pembayaran.
            </p>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 inline-flex items-center gap-3 bg-[#F2EFE8] border border-[#DAD6CC] px-5 py-2.5 rounded-full shadow-2xs"
          >
            <span className="micro-label text-[#8B877E] font-medium tracking-wider">
              NOMOR PESANAN:
            </span>
            <span className="text-base font-mono font-bold text-[#111111]">
              {orderNo}
            </span>
          </motion.div>

          {/* Primary WhatsApp Confirmation Button */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8"
          >
            <a
              href={defaultWaUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 bg-[#2F6B3F] hover:bg-emerald-800 text-white rounded-full micro-label text-xs tracking-widest font-medium transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Konfirmasi via WhatsApp Sekarang</span>
            </a>
            <p className="text-xs text-[#8B877E] mt-2">
              Langsung terhubung dengan Customer Service GMC Surabaya.
            </p>
          </motion.div>
        </div>

        {/* Order Details Body */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-8 print:block">
          {/* Main Info (Left 7 cols) */}
          <div className="md:col-span-7 space-y-8">
            {/* Items Card */}
            <div className="bg-white/40 p-6 sm:p-7 rounded-[2px] border border-[#DAD6CC] print:border-none print:p-0">
              <h2 className="text-base font-normal tracking-tight text-[#111111] pb-4 border-b border-[#DAD6CC]">
                Rincian Barang yang Dipesan
              </h2>

              <div className="divide-y divide-[#DAD6CC]">
                {order?.items && order.items.length > 0 ? (
                  order.items.map((it, idx) => (
                    <div key={idx} className="py-4 first:pt-4 flex justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-[#111111]">{it.productName}</h3>
                        <p className="text-xs text-[#5F5C55] mt-0.5">
                          {it.optionsSummary && `Varian: ${it.optionsSummary} · `}
                          <span className="font-mono text-[#8B877E]">SKU: {it.variantSku}</span>
                        </p>
                        <p className="text-xs text-[#8B877E] mt-1 tabular-nums">
                          {it.quantity} x {formatRupiah(it.priceIdr ?? 0)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-medium text-[#111111] tabular-nums">
                          {formatRupiah((it.priceIdr ?? 0) * it.quantity)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-xs text-[#8B877E]">
                    {loading ? "Memuat rincian produk…" : "Data rincian tersimpan di sistem."}
                  </div>
                )}
              </div>

              {/* Total Summary */}
              <div className="pt-4 border-t border-[#DAD6CC] space-y-2 text-sm">
                <div className="flex justify-between text-[#5F5C55]">
                  <span>Subtotal</span>
                  <span className="text-[#111111] font-medium tabular-nums">
                    {order ? formatRupiah(order.subtotalIdr) : "-"}
                  </span>
                </div>
                <div className="flex justify-between text-[#5F5C55]">
                  <span>Pengiriman</span>
                  <span className="text-[#2F6B3F] font-medium text-xs">
                    {order?.deliveryMethod === "delivery" ? "Dikonfirmasi via WA" : "Gratis (Ambil di Toko)"}
                  </span>
                </div>
                <div className="flex justify-between text-base font-medium text-[#111111] pt-2 border-t border-[#DAD6CC]">
                  <span>Total Transaksi</span>
                  <span className="text-xl font-bold tabular-nums">
                    {order ? formatRupiah(order.totalIdr) : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery & Recipient Card */}
            <div className="bg-white/40 p-6 sm:p-7 rounded-[2px] border border-[#DAD6CC] text-sm">
              <h2 className="text-base font-normal tracking-tight text-[#111111] pb-3 border-b border-[#DAD6CC]">
                Informasi Pengambilan / Pengiriman
              </h2>

              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  {order?.deliveryMethod === "delivery" ? (
                    <Truck className="w-5 h-5 text-[#111111] shrink-0 mt-0.5" />
                  ) : (
                    <Store className="w-5 h-5 text-[#111111] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-medium text-[#111111] block">
                      {order?.deliveryMethod === "delivery"
                        ? "Pengiriman ke Alamat Pemesan"
                        : "Ambil Sendiri di Toko Fisik GMC"}
                    </span>
                    {order?.deliveryMethod === "delivery" ? (
                      <p className="text-xs text-[#5F5C55] mt-1 leading-relaxed">
                        Penerima: {order.shippingAddress?.recipientName || order.customerName} ({order.shippingAddress?.phone || order.customerPhone})
                        <br />
                        {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.province} {order.shippingAddress?.postalCode}
                      </p>
                    ) : (
                      <p className="text-xs text-[#5F5C55] mt-1 leading-relaxed">
                        {siteConfig.contact.address}
                        <br />
                        Jam Buka: {siteConfig.contact.openingHours}
                      </p>
                    )}
                  </div>
                </div>

                {order?.note && (
                  <div className="mt-4 pt-3 border-t border-[#DAD6CC]">
                    <span className="micro-label text-[#8B877E] block mb-1">
                      CATATAN PESANAN:
                    </span>
                    <p className="text-xs text-[#111111] bg-[#F2EFE8] p-3 rounded-[2px] border border-[#DAD6CC]">
                      {order.note}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Instructions (Right 5 cols) */}
          <div className="md:col-span-5 space-y-6 print:hidden">
            {/* Bank Transfer Details */}
            <div className="bg-[#F2EFE8] p-6 rounded-[2px] border border-[#DAD6CC]">
              <div className="flex items-center gap-2 pb-3 border-b border-[#DAD6CC]">
                <Building2 className="w-5 h-5 text-[#111111]" />
                <h2 className="micro-label text-[#111111] font-medium tracking-wider">
                  REKENING PEMBAYARAN RESMI
                </h2>
              </div>

              <p className="text-xs text-[#5F5C55] mt-3 leading-relaxed">
                Jika Anda memilih metode Transfer Bank, silakan lakukan transfer ke rekening resmi atas nama toko berikut setelah konfirmasi admin:
              </p>

              <div className="mt-4 space-y-3">
                {/* Bank BCA */}
                <div className="p-3 bg-white rounded-[2px] border border-[#DAD6CC]">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-[#111111] block">Bank BCA</span>
                      <span className="text-sm font-mono font-bold text-[#111111] mt-0.5 block tabular-nums">
                        018-829-4471
                      </span>
                      <span className="text-[11px] text-[#5F5C55]">a/n Global Mandiri Computer</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard("0188294471", "bca")}
                      className="text-xs inline-flex items-center gap-1 text-[#5F5C55] hover:text-[#111111] p-1 cursor-pointer"
                      title="Salin No Rekening"
                    >
                      {copiedBank === "bca" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Bank Mandiri */}
                <div className="p-3 bg-white rounded-[2px] border border-[#DAD6CC]">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-[#111111] block">Bank Mandiri</span>
                      <span className="text-sm font-mono font-bold text-[#111111] mt-0.5 block tabular-nums">
                        141-00-1928472-1
                      </span>
                      <span className="text-[11px] text-[#5F5C55]">a/n Global Mandiri Computer</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard("1410019284721", "mandiri")}
                      className="text-xs inline-flex items-center gap-1 text-[#5F5C55] hover:text-[#111111] p-1 cursor-pointer"
                      title="Salin No Rekening"
                    >
                      {copiedBank === "mandiri" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#DAD6CC] flex items-center gap-2 text-xs text-[#8B877E]">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Simpan bukti transfer untuk dikirimkan melalui WhatsApp.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handlePrint}
                className="w-full h-12 bg-white border border-[#DAD6CC] text-[#111111] rounded-full flex items-center justify-center gap-2 micro-label text-xs tracking-wider font-medium hover:border-[#111111] transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Bukti Pemesanan</span>
              </button>

              <Link
                href="/shop"
                className="w-full h-12 bg-[#000000] text-white rounded-full flex items-center justify-center gap-2 micro-label text-xs tracking-widest font-medium hover:bg-black/85 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Kembali Belanja</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
