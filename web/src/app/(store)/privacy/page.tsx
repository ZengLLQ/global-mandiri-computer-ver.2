import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | Global Mandiri Computer (GMC)",
  description: "Kebijakan privasi dan perlindungan data pelanggan Global Mandiri Computer ITC Mega Grosir Surabaya.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12 sm:py-16 border-b border-[#DAD6CC]">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#5F5C55] hover:text-[#111111] mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>

        <div className="pb-8 border-b border-[#DAD6CC]">
          <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#8B877E] block mb-2">
            Dokumen Legal
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal text-[#111111] tracking-tight">
            Kebijakan Privasi
          </h1>
          <p className="text-xs text-[#8B877E] mt-3">
            Terakhir diperbarui: 14 Oktober 2026
          </p>
        </div>

        <div className="mt-8 space-y-8 text-sm text-[#5F5C55] leading-relaxed">
          <section>
            <h2 className="text-base font-medium text-[#111111] mb-3">1. Pengantar</h2>
            <p>
              Global Mandiri Computer (&ldquo;GMC&rdquo;, &ldquo;kami&rdquo;) yang berlokasi di {siteConfig.contact.address} menghargai dan berkomitmen menjaga privasi serta keamanan data pribadi Anda selaku pengguna dan pelanggan toko kami. Dokumen kebijakan privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-[#111111] mb-3">2. Data yang Kami Kumpulkan</h2>
            <p className="mb-2">Kami mengumpulkan data yang Anda berikan secara langsung saat menggunakan situs ini, meliputi:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nama lengkap, nomor telepon / WhatsApp, dan alamat email.</li>
              <li>Alamat penagihan dan alamat pengiriman barang.</li>
              <li>Riwayat transaksi pemesanan dan catatan preferensi perakitan PC.</li>
              <li>Komunikasi layanan pelanggan melalui form kontak atau WhatsApp resmi kami.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-[#111111] mb-3">3. Tujuan Penggunaan Informasi</h2>
            <p className="mb-2">Data Anda digunakan secara eksklusif untuk kepentingan operasional toko, antara lain:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Memproses verifikasi stok, pesanan barang, dan penerbitan nota / faktur garansi.</li>
              <li>Menghubungi Anda via WhatsApp untuk konfirmasi pengiriman atau pengambilan di toko fisik.</li>
              <li>Mendukung proses klaim garansi resmi produk hardware ke distributor brand terkait.</li>
              <li>Mengirimkan informasi pembaruan stok atau promo khusus jika Anda memilih berlangganan newsletter kami.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-[#111111] mb-3">4. Keamanan dan Perlindungan Data</h2>
            <p>
              Kami menerapkan standar enkripsi dan kontrol akses internal untuk melindungi data akun dan riwayat pemesanan Anda dari akses yang tidak sah. Kata sandi akun disimpan dalam bentuk hash kriptografi satu arah (Argon2id) yang tidak dapat dibaca oleh staf kami.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-[#111111] mb-3">5. Hubungi Kami</h2>
            <p>
              Jika Anda memiliki pertanyaan mengenai penggunaan data pribadi Anda, Anda dapat menghubungi kami secara langsung di toko fisik ITC Mega Grosir Surabaya atau melalui WhatsApp di{" "}
              <a href={siteConfig.contact.whatsappUrl} className="text-[#111111] underline">
                {siteConfig.contact.phone}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
