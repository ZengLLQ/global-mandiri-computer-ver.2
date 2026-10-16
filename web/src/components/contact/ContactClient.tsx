"use client";

import React, { useState } from "react";
import { siteConfig } from "@/config/site";
import { copy } from "@/config/copy";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  Send,
} from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  phone: z
    .string()
    .min(9, "Nomor WhatsApp minimal 9 digit")
    .regex(/^(08|62|\+62)[0-9]{7,13}$/, "Gunakan format nomor Indonesia (contoh: 0822…)"),
  subject: z.string().min(1, "Pilih subjek keperluan"),
  message: z.string().min(5, "Pesan minimal 5 karakter"),
  honeypot: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

export const ContactClient: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [waUrl, setWaUrl] = useState("");
  const [openFaq, setOpenFaq] = useState<string | null>("cara-pesan");
  const [apiError, setApiError] = useState("");
  const [activeSidebarSection, setActiveSidebarSection] = useState("kontak");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      subject: "tanya-produk",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setApiError("");
    const mapSubject = (s: string): "order" | "tanya_produk" | "garansi_retur" | "lainnya" => {
      if (s === "order") return "order";
      if (s === "tanya-produk" || s === "tanya_produk" || s === "rakit-pc") return "tanya_produk";
      if (s === "garansi" || s === "garansi_retur") return "garansi_retur";
      return "lainnya";
    };

    try {
      const res = await api.submitContact({
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: mapSubject(data.subject),
        message: data.message,
        website: data.honeypot || "",
      });
      setIsSubmitted(true);
      setWaUrl(res.whatsappUrl);
      reset();
    } catch {
      // Offline fallback
      const waText = encodeURIComponent(
        `Halo GMC Surabaya, saya ${data.name} (${data.subject}): ${data.message}`
      );
      setWaUrl(`${siteConfig.contact.whatsappUrl}?text=${waText}`);
      setIsSubmitted(true);
      reset();
    }
  };

  const sidebarLinks = [
    { id: "kontak", label: "Kontak & Lokasi", targetId: "kontak-section" },
    { id: "pengiriman", label: "Pengiriman & Ambil di Toko", targetId: "pengiriman" },
    { id: "garansi", label: "Ketentuan Garansi", targetId: "garansi" },
    { id: "faq", label: "Pertanyaan Umum (FAQ)", targetId: "faq" },
  ];

  const scrollToSection = (targetId: string, id: string) => {
    setActiveSidebarSection(id);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="w-full bg-[var(--bg)] text-[var(--ink)]">
      {/* 1. Header & Contact Details Grid (Matches Lujo's contact-main) */}
      <section id="kontak-section" className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-16 lg:py-24 border-b border-[var(--line)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Sidebar Navigation + Info (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            {/* Lujo-style Help Sidebar Links */}
            <div className="flex flex-wrap gap-2 pb-2">
              {sidebarLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollToSection(link.targetId, link.id)}
                  className={`px-4 py-2 rounded-full text-xs font-medium tracking-tight transition-all cursor-pointer ${
                    activeSidebarSection === link.id
                      ? "bg-[var(--btn)] text-[var(--btn-ink)]"
                      : "border border-[var(--line)] bg-[var(--panel)] text-[var(--ink-2)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div>
              <span className="micro-label text-[var(--ink-3)] block mb-2 tracking-widest">
                PUSAT LAYANAN & INFORMASI
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[var(--ink)] leading-[1.05]">
                {copy.contact.title}
              </h1>
              <p className="text-sm sm:text-base text-[var(--ink-2)] mt-3 leading-relaxed">
                {copy.contact.subtitle}
              </p>
            </div>

            {/* Info blocks separated by 1px hairlines */}
            <div className="border-t border-[var(--line)] divide-y divide-[var(--line)]">
              {/* WhatsApp */}
              <div className="py-4 space-y-1">
                <span className="micro-label text-[var(--ink-3)] tracking-wider">WHATSAPP (RESPON CEPAT)</span>
                <p className="text-base font-medium text-[var(--ink)]">
                  {siteConfig.contact.whatsappDisplay}
                </p>
                <p className="text-xs text-[var(--ink-2)]">
                  Layanan konsultasi spesifikasi PC rakitan, ketersediaan stok, dan konfirmasi order
                </p>
              </div>

              {/* Email */}
              <div className="py-4 space-y-1">
                <span className="micro-label text-[var(--ink-3)] tracking-wider">EMAIL RESMI</span>
                <p className="text-base font-medium text-[var(--ink)]">
                  {siteConfig.contact.email}
                </p>
                <p className="text-xs text-[var(--ink-2)]">
                  Untuk penawaran pengadaan kantor, sekolah, atau instansi
                </p>
              </div>

              {/* Physical Address */}
              <div className="py-4 space-y-1">
                <span className="micro-label text-[var(--ink-3)] tracking-wider">LOKASI COUNTER TOKO</span>
                <p className="text-base font-medium text-[var(--ink)]">
                  {siteConfig.location.mall}
                </p>
                <p className="text-xs text-[var(--ink-2)]">
                  {siteConfig.location.unit}, Surabaya, Jawa Timur
                </p>
              </div>

              {/* Opening Hours */}
              <div className="py-4 space-y-1">
                <span className="micro-label text-[var(--ink-3)] tracking-wider">JAM OPERASIONAL</span>
                <p className="text-base font-medium text-[var(--ink)]">
                  {siteConfig.openingHours}
                </p>
                <p className="text-xs text-[var(--ink-2)]">
                  Hari Minggu & Libur Nasional counter toko tutup (chat WA dibalas hari kerja)
                </p>
              </div>
            </div>

            {/* Action Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={siteConfig.contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] micro-label text-xs tracking-widest hover:opacity-90 transition-opacity shadow-md"
              >
                <MessageCircle size={15} />
                <span>Chat WhatsApp</span>
              </a>

              <a
                href={siteConfig.location.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-[var(--ink)] text-[var(--ink)] micro-label text-xs tracking-widest hover:bg-[var(--ink)] hover:text-[var(--btn-ink)] transition-colors"
              >
                <span>Buka Google Maps</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* Right Contact Form (7 cols) */}
          <div className="lg:col-span-7 bg-[var(--panel)] border border-[var(--line)] p-8 sm:p-12 rounded-[2px]">
            {isSubmitted ? (
              <div className="text-center py-12 space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-[var(--success)]/10 text-[var(--success)] flex items-center justify-center">
                  <CheckCircle2 size={36} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-light text-[var(--ink)]">Pesan Terkirim</h3>
                  <p className="text-sm text-[var(--ink-2)] max-w-md mx-auto leading-relaxed">
                    {copy.contact.form.successMessage}
                  </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] micro-label text-xs tracking-widest hover:opacity-90 shadow-md"
                  >
                    <MessageCircle size={16} />
                    <span>Lanjutkan via WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="text-xs text-[var(--ink-2)] hover:text-[var(--ink)] underline py-2 cursor-pointer"
                  >
                    Kirim pesan lain
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <h3 className="text-2xl font-light tracking-tight text-[var(--ink)] mb-1">
                    Formulir Pertanyaan & Permintaan
                  </h3>
                  <p className="text-xs text-[var(--ink-2)]">
                    Silakan isi pesan Anda. Tim teknis GMC akan membalas dengan penawaran resmi.
                  </p>
                </div>

                {/* Honeypot field for bot trapping */}
                <input
                  type="text"
                  {...register("honeypot")}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="micro-label text-[var(--ink)] block mb-1.5">
                      {copy.contact.form.nameLabel} *
                    </label>
                    <input
                      type="text"
                      {...register("name")}
                      placeholder="Nama lengkap Anda"
                      className="w-full h-11 px-3.5 rounded-[2px] border border-[var(--line)] bg-[var(--bg)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--ink)]"
                    />
                    {errors.name && (
                      <p className="text-[var(--danger)] text-xs mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Email & Phone Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="micro-label text-[var(--ink)] block mb-1.5">
                        {copy.contact.form.emailLabel} *
                      </label>
                      <input
                        type="email"
                        {...register("email")}
                        placeholder="nama@email.com"
                        className="w-full h-11 px-3.5 rounded-[2px] border border-[var(--line)] bg-[var(--bg)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--ink)]"
                      />
                      {errors.email && (
                        <p className="text-[var(--danger)] text-xs mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="micro-label text-[var(--ink)] block mb-1.5">
                        {copy.contact.form.phoneLabel} *
                      </label>
                      <input
                        type="tel"
                        {...register("phone")}
                        placeholder="082232554674"
                        className="w-full h-11 px-3.5 rounded-[2px] border border-[var(--line)] bg-[var(--bg)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--ink)]"
                      />
                      {errors.phone && (
                        <p className="text-[var(--danger)] text-xs mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Subject Dropdown */}
                  <div>
                    <label className="micro-label text-[var(--ink)] block mb-1.5">
                      {copy.contact.form.subjectLabel} *
                    </label>
                    <select
                      {...register("subject")}
                      className="w-full h-11 px-3.5 rounded-[2px] border border-[var(--line)] bg-[var(--bg)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--ink)] cursor-pointer"
                    >
                      {copy.contact.form.subjects.map((sub) => (
                        <option key={sub.value} value={sub.value}>
                          {sub.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message Textarea */}
                  <div>
                    <label className="micro-label text-[var(--ink)] block mb-1.5">
                      {copy.contact.form.messageLabel} *
                    </label>
                    <textarea
                      rows={4}
                      {...register("message")}
                      placeholder="Tuliskan spesifikasi PC rakitan atau pertanyaan produk yang ingin Anda ketahui…"
                      className="w-full p-3.5 rounded-[2px] border border-[var(--line)] bg-[var(--bg)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--ink)] resize-none"
                    />
                    {errors.message && (
                      <p className="text-[var(--danger)] text-xs mt-1">{errors.message.message}</p>
                    )}
                  </div>
                </div>

                {apiError && (
                  <p className="text-[var(--danger)] text-xs">{apiError}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] micro-label text-xs tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Send size={13} />
                  <span>{isSubmitting ? "MENGIRIM…" : copy.contact.form.submitBtn}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 2. FAQ Section with Lujo's Signature Animated + / - Line Morph */}
      <section id="faq" className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 py-20 lg:py-28">
        <div className="max-w-3xl mb-12">
          <span className="micro-label text-[var(--ink-3)] block mb-2 tracking-widest">
            PANDUAN & BANTUAN
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[var(--ink)]">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h2>
          <p className="text-sm text-[var(--ink-2)] mt-2">
            Informasi lengkap seputar pemesanan, pembayaran, pengiriman, dan klaim garansi produk di GMC Surabaya.
          </p>
        </div>

        <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {copy.faq.map((item) => {
            const isOpen = openFaq === item.id;
            return (
              <div key={item.id} id={item.id} className="py-6 scroll-mt-24">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : item.id)}
                  className="w-full flex items-center justify-between gap-4 text-left group cursor-pointer"
                >
                  <span className="text-lg sm:text-xl font-normal text-[var(--ink)] group-hover:text-black transition-colors">
                    {item.question}
                  </span>
                  
                  {/* Lujo's morphing + / - line SVG */}
                  <div className="relative w-5 h-5 flex items-center justify-center text-[var(--ink)] flex-shrink-0">
                    <span className="absolute w-4 h-[1.5px] bg-current" />
                    <span
                      className={`absolute w-4 h-[1.5px] bg-current transition-transform duration-300 ${
                        isOpen ? "rotate-0 scale-0 opacity-0" : "rotate-90 scale-100 opacity-100"
                      }`}
                    />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 text-sm sm:text-base text-[var(--ink-2)] leading-relaxed max-w-3xl pr-6">
                        <p>{item.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
