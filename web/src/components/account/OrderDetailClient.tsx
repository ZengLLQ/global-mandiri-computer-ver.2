"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { OrderDetail } from "@/types/api";
import { formatRupiah, siteConfig } from "@/config/site";
import {
  ArrowLeft,
  Printer,
  MessageCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface OrderDetailClientProps {
  orderNo: string;
}

export const OrderDetailClient: React.FC<OrderDetailClientProps> = ({ orderNo }) => {
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
            statusHistory: [
              {
                status: "menunggu_konfirmasi",
                note: "Pesanan masuk ke sistem GMC",
                createdAt: parsed.createdAt,
              },
            ],
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
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Fetch latest status from API
    api
      .getOrder(orderNo)
      .then((data) => {
        setOrder(data);
      })
      .catch((err: unknown) => {
        const error = err as Error;
        setErrorMsg(error.message || "Pesanan tidak ditemukan atau sesi verifikasi kedaluwarsa.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderNo]);

  const handlePrint = () => {
    window.print();
  };

  const statusSteps = [
    { key: "menunggu_konfirmasi", label: "Menunggu Konfirmasi" },
    { key: "dikonfirmasi", label: "Dikonfirmasi" },
    { key: "diproses", label: "Diproses Toko" },
    { key: "siap_diambil", label: "Siap Diambil / Dikirim" },
    { key: "selesai", label: "Selesai" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "menunggu_konfirmasi":
        return 0;
      case "dikonfirmasi":
        return 1;
      case "diproses":
        return 2;
      case "siap_diambil":
        return 3;
      case "selesai":
        return 4;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#111111]" />
      </div>
    );
  }

  if (errorMsg && !order) {
    return (
      <div className="min-h-[70vh] max-w-xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-[#B3261E] mx-auto mb-4" />
        <h1 className="text-2xl font-normal text-[#111111] mb-2">Informasi Pesanan</h1>
        <p className="text-sm text-[#5F5C55] mb-6">{errorMsg}</p>
        <Link
          href="/account"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#000000] text-white rounded-full text-xs uppercase tracking-wider font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Akun</span>
        </Link>
      </div>
    );
  }

  const currentStep = getStepIndex(order?.status || "menunggu_konfirmasi");

  const waMessage = `Halo Admin GMC, saya ingin menanyakan perkembangan pesanan nomor *${orderNo}*:
- Nama: ${order?.customerName}
- Total: ${order ? formatRupiah(order.totalIdr) : ""}

Mohon bantuan update statusnya. Terima kasih!`;
  const waUrl = `https://wa.me/6282232554674?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="min-h-screen py-8 sm:py-12 border-b border-[#DAD6CC] print:py-0 print:border-none">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DAD6CC] print:hidden">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#5F5C55] hover:text-[#111111]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Riwayat Pesanan</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#DAD6CC] text-xs uppercase tracking-wider text-[#111111] hover:bg-[#F2EFE8] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Invoice</span>
            </button>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#2F6B3F] text-white text-xs uppercase tracking-wider font-medium hover:bg-emerald-800 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Tanya Admin WA</span>
            </a>
          </div>
        </div>

        {/* Print Invoice Header */}
        <div className="hidden print:block my-6 pb-4 border-b border-black">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">GLOBAL MANDIRI COMPUTER</h1>
              <p className="text-xs text-neutral-600 mt-1">{siteConfig.contact.address}</p>
              <p className="text-xs text-neutral-600">WhatsApp: {siteConfig.contact.phone}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono uppercase block text-neutral-500">FAKTUR PESANAN</span>
              <span className="text-lg font-mono font-bold">{orderNo}</span>
              <p className="text-xs text-neutral-600 mt-1">
                {order ? new Date(order.createdAt).toLocaleDateString("id-ID", { dateStyle: "long" }) : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Order Header Summary */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#8B877E] font-medium block mb-1">
              Rincian Transaksi
            </span>
            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-[#111111]">
              {orderNo}
            </h1>
            <p className="text-xs text-[#5F5C55] mt-1">
              Dibuat pada {order ? new Date(order.createdAt).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-"}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-[#8B877E] block uppercase tracking-wider">Total Pembayaran</span>
            <span className="text-2xl font-bold text-[#111111] tabular-nums">
              {order ? formatRupiah(order.totalIdr) : "-"}
            </span>
          </div>
        </div>

        {/* Timeline Status (Screen only) */}
        <div className="mt-8 p-6 bg-white/40 border border-[#DAD6CC] rounded-[2px] print:hidden">
          <h2 className="text-xs uppercase tracking-wider text-[#8B877E] font-medium mb-6">
            Status Pemrosesan Pesanan
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative">
            {statusSteps.map((step, idx) => {
              const isPastOrCurrent = idx <= currentStep;
              return (
                <div key={step.key} className="flex flex-col items-center text-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium mb-2 border ${
                      isPastOrCurrent
                        ? "bg-[#111111] text-white border-[#111111]"
                        : "bg-[#F2EFE8] text-[#8B877E] border-[#DAD6CC]"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`text-xs ${
                      isPastOrCurrent ? "font-medium text-[#111111]" : "text-[#8B877E]"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Items Breakdown */}
        <div className="mt-8 bg-white/40 border border-[#DAD6CC] rounded-[2px] p-6 sm:p-8 print:border-none print:p-0">
          <h2 className="text-base font-medium text-[#111111] pb-4 border-b border-[#DAD6CC]">
            Daftar Produk
          </h2>

          <div className="divide-y divide-[#DAD6CC]">
            {order?.items?.map((it, idx) => (
              <div key={idx} className="py-4 flex justify-between items-center gap-4">
                <div>
                  <h3 className="text-sm font-medium text-[#111111]">{it.productName}</h3>
                  <div className="text-xs text-[#5F5C55] mt-0.5 space-x-2">
                    {it.optionsSummary && <span>Varian: {it.optionsSummary}</span>}
                    <span className="font-mono text-[#8B877E]">SKU: {it.variantSku}</span>
                  </div>
                  <span className="text-xs text-[#8B877E] block mt-1">
                    <span className="tabular-nums">{it.quantity}</span> x <span className="tabular-nums">{formatRupiah(it.priceIdr ?? 0)}</span>
                  </span>
                </div>
                <span className="text-sm font-medium text-[#111111] shrink-0 tabular-nums">
                  {formatRupiah((it.priceIdr ?? 0) * it.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-[#DAD6CC] space-y-2 text-sm">
            <div className="flex justify-between text-[#5F5C55]">
              <span>Subtotal Produk</span>
              <span className="text-[#111111] font-medium tabular-nums">{order ? formatRupiah(order.subtotalIdr) : "-"}</span>
            </div>
            <div className="flex justify-between text-[#5F5C55]">
              <span>Metode Pengambilan / Kirim</span>
              <span className="text-[#111111] font-medium">
                {order?.deliveryMethod === "delivery" ? "Kirim ke Alamat" : "Ambil di Toko (Gratis)"}
              </span>
            </div>
            <div className="flex justify-between text-[#5F5C55]">
              <span>Metode Pembayaran</span>
              <span className="text-[#111111] font-medium capitalize">
                {order?.paymentMethod?.replace("_", " ")}
              </span>
            </div>
            <div className="flex justify-between text-base font-medium text-[#111111] pt-3 border-t border-[#DAD6CC]">
              <span>Total Tagihan</span>
              <span className="text-xl font-bold tabular-nums">{order ? formatRupiah(order.totalIdr) : "-"}</span>
            </div>
          </div>
        </div>

        {/* Shipping & Recipient Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/40 border border-[#DAD6CC] rounded-[2px] p-6 text-sm">
            <h3 className="font-medium text-[#111111] pb-3 border-b border-[#DAD6CC]">
              Informasi Pemesan
            </h3>
            <div className="mt-3 space-y-1.5 text-xs text-[#5F5C55]">
              <p>Nama: <strong className="text-[#111111]">{order?.customerName}</strong></p>
              <p>WhatsApp: <strong className="text-[#111111]">{order?.customerPhone}</strong></p>
              {order?.customerEmail && <p>Email: {order.customerEmail}</p>}
            </div>
          </div>

          <div className="bg-white/40 border border-[#DAD6CC] rounded-[2px] p-6 text-sm">
            <h3 className="font-medium text-[#111111] pb-3 border-b border-[#DAD6CC]">
              Tujuan / Lokasi
            </h3>
            <div className="mt-3 text-xs text-[#5F5C55] leading-relaxed">
              {order?.deliveryMethod === "delivery" && order.shippingAddress ? (
                <>
                  <p className="font-medium text-[#111111]">{order.shippingAddress.recipientName} ({order.shippingAddress.phone})</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}</p>
                </>
              ) : (
                <>
                  <p className="font-medium text-[#111111]">Ambil di Toko Fisik GMC</p>
                  <p>{siteConfig.contact.address}</p>
                  <p className="text-[#8B877E] mt-1">{siteConfig.contact.openingHours}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
