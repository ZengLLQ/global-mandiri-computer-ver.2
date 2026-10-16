import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan Layanan | Global Mandiri Computer (GMC)",
  description: "Syarat dan ketentuan pembelian, garansi produk, dan pemesanan hardware di Global Mandiri Computer ITC Mega Grosir Surabaya.",
};

export default function TermsPage() {
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
            Syarat & Ketentuan
          </h1>
          <p className="text-xs text-[#8B877E] mt-3">
            Terakhir diperbarui: 14 Oktober 2026
          </p>
        </div>

        <div className="mt-8 space-y-8 text-sm text-[#5F5C55] leading-relaxed">
          <section>
            <h2 className="text-base font-medium text-[#111111] mb-3">1. Umum & Ketentuan Pemesanan</h2>
            <p>
              Dengan melakukan pemesanan di website Global Mandiri Computer (&ldquo;GMC&rdquo;), Anda menyetujui alur transaksi resmi kami. Pemesanan melalui website ini berstatus permintaan pesanan (&ldquo;Order Request&rdquo;) yang akan divalidasi ketersediaan fisik stoknya oleh staf toko sebelum pembayaran diselesaikan.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-[#111111] mb-3">2. Harga dan Ketersediaan Stok</h2>
            <p>
              Harga yang tertera pada katalog adalah dalam mata uang Rupiah (IDR). Kami selalu berusaha memperbarui harga dan stok secara berkala. Apabila terjadi perbedaan harga atau stok habis akibat dinamika pasar komponen komputer, kami berhak mengonfirmasi ulang perubahan tersebut kepada Anda sebelum pesanan diproses.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-[#111111] mb-3">3. Garansi dan Keaslian Produk</h2>
            <p className="mb-2">
              Semua produk yang dijual oleh GMC adalah 100% barang baru dan bergaransi resmi dari distributor resmi di Indonesia (misal: Astrindo, Synnex Metrodata, NJT, EMD, DTG, dll.).
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Masa garansi berlaku sesuai ketentuan masing-masing brand (1 hingga 5 tahun tergantung komponen).</li>
              <li>Garansi tidak mencakup kerusakan fisik, kelalaian pengguna, korsleting akibat instalasi keliru, atau bencana alam.</li>
              <li>Nota pembelian dan stiker garansi pada komponen wajib disimpan untuk mempermudah klaim garansi.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-[#111111] mb-3">4. Pengambilan di Toko dan Pengiriman</h2>
            <p className="mb-2">
              Pelanggan dipersilakan memilih opsi &ldquo;Ambil di Toko&rdquo; di ITC Mega Grosir Surabaya tanpa dipungut biaya tambahan, atau memilih pengiriman ke alamat:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Pengiriman dalam kota Surabaya dapat menggunakan kurir instan setelah pembayaran terkonfirmasi.</li>
              <li>Pengiriman luar kota menggunakan ekspedisi terpercaya dengan opsi asuransi dan packing kayu demi keamanan komponen rapuh (seperti monitor, casing kaca tempered, dan water cooling).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-[#111111] mb-3">5. Kontak Konsultasi & Klaim</h2>
            <p>
              Untuk konsultasi rakitan, cek kompatibilitas komponen, atau bantuan klaim garansi, Anda dapat menghubungi tim teknisi kami di ITC Mega Grosir Lt. 2 Blok B/7 Surabaya atau melalui WhatsApp di{" "}
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
