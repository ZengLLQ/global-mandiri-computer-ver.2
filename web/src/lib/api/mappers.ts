import type { UseFormSetError } from "react-hook-form";

/**
 * Format IDR integer to Indonesian Rupiah representation: Rp 1.599.000
 */
export function toPriceDisplay(priceIdr: number | bigint): string {
  const num = typeof priceIdr === "bigint" ? Number(priceIdr) : priceIdr;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Human-friendly stock label
 */
export function toStockLabel(
  status: "in_stock" | "low_stock" | "out_of_stock" | "preorder",
  stock?: number
): string {
  switch (status) {
    case "in_stock":
      return "Stok Tersedia";
    case "low_stock":
      return stock !== undefined ? `Sisa ${stock} unit` : "Stok Menipis";
    case "out_of_stock":
      return "Stok Habis";
    case "preorder":
      return "Pre-Order";
    default:
      return "Tersedia";
  }
}

/**
 * Human-friendly order status badge label and color variant
 */
export function toOrderStatusLabel(status: string): { label: string; color: string } {
  switch (status) {
    case "menunggu_konfirmasi":
      return { label: "Menunggu Konfirmasi", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
    case "menunggu_pembayaran":
      return { label: "Menunggu Pembayaran", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
    case "diproses":
      return { label: "Sedang Diproses", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" };
    case "dikirim":
      return { label: "Sedang Dikirim", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" };
    case "siap_diambil":
      return { label: "Siap Diambil di Toko", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
    case "selesai":
      return { label: "Selesai", color: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20" };
    case "dibatalkan":
      return { label: "Dibatalkan", color: "bg-red-500/10 text-red-500 border-red-500/20" };
    default:
      return { label: status, color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };
  }
}

/**
 * Format RFC 3339 UTC date to Asia/Jakarta locale representation
 */
export function toFormattedDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return isoString;
  }
}

/**
 * Map API validation error fields directly into React Hook Form
 */
export function applyFieldErrors<T extends Record<string, any>>(
  setError: UseFormSetError<T>,
  fields?: Record<string, string>
): void {
  if (!fields) return;

  for (const [key, msg] of Object.entries(fields)) {
    setError(key as any, {
      type: "server",
      message: msg,
    });
  }
}

/**
 * Adapter mapper from OpenAPI ProductCard to Storefront ProductCard
 */
export function mapProductCard(item: any): any {
  if (!item) return item;
  return {
    ...item,
    minPriceIdr: item.priceFromIdr ?? item.minPriceIdr ?? item.minPriceIDR ?? 0,
    minPriceIDR: item.priceFromIdr ?? item.minPriceIdr ?? item.minPriceIDR ?? 0,
    primaryImageUrl: item.primaryImage?.url || item.primaryImageUrl || "",
    secondaryImageUrl: item.secondaryImage?.url || item.secondaryImageUrl || null,
    isReady: item.stockStatus === "in_stock" || item.isReady === true,
  };
}

/**
 * Adapter mapper from OpenAPI ProductDetail to Storefront ProductDetail
 */
export function mapProductDetail(p: any): any {
  if (!p) return p;
  const valIdToLabel = new Map<string, string>();
  if (Array.isArray(p.options)) {
    p.options.forEach((opt: any) => {
      if (Array.isArray(opt.values)) {
        opt.values.forEach((v: any) => {
          if (typeof v === "object" && v !== null && v.id) {
            valIdToLabel.set(v.id, v.label);
          }
        });
      }
    });
  }

  const mappedVariants = Array.isArray(p.variants)
    ? p.variants.map((v: any) => {
        const optionValues: Record<string, string> = { ...(v.optionValues || {}) };
        if (Array.isArray(v.optionValueIds)) {
          v.optionValueIds.forEach((id: string) => {
            optionValues[id] = valIdToLabel.get(id) || id;
          });
        }
        return {
          ...v,
          priceIdr: v.priceIdr ?? v.priceIDR ?? 0,
          priceIDR: v.priceIdr ?? v.priceIDR ?? 0,
          optionValues,
          status:
            v.status ||
            (v.stockStatus === "in_stock"
              ? "ready"
              : v.stockStatus === "preorder"
              ? "preorder"
              : "habis"),
        };
      })
    : [];

  return {
    ...p,
    variants: mappedVariants,
    crossSells: Array.isArray(p.crossSells) ? p.crossSells.map(mapProductCard) : [],
  };
}
