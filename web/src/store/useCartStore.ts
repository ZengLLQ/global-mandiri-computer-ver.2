"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, type CartValidateResponse } from "@/lib/api";

export interface StoredCartItem {
  variantId: string;
  quantity: number;
}

export interface CartItem {
  id: string; // maps to variantId
  variantId: string;
  sku: string;
  slug: string;
  productSlug: string;
  name: string;
  brand: string;
  variantSku: string;
  variantName: string;
  priceIdr: number;
  compareAtPriceIdr?: number | null;
  quantity: number;
  lineTotalIdr: number;
  stock: number;
  maxStock: number;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock" | "preorder";
  issue?: "out_of_stock" | "insufficient_stock" | "unavailable" | null;
  imageUrl: string;
}

interface CartStore {
  rawItems: StoredCartItem[];
  items: CartItem[]; // validated lines for UI display
  orderNote: string;
  isDrawerOpen: boolean;
  isValidating: boolean;
  serverSubtotalIdr: number;
  hasIssues: boolean;

  // Actions
  addItem: (item: { id?: string; variantId?: string; [key: string]: any }, qty?: number) => void;
  removeItem: (idOrVariantId: string) => void;
  updateQuantity: (idOrVariantId: string, deltaOrExact: number, isAbsolute?: boolean) => void;
  setOrderNote: (note: string) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  validateWithServer: () => Promise<CartValidateResponse | null>;
  setValidationResult: (res: CartValidateResponse) => void;

  // Computed getters
  totalCount: () => number;
  subtotalIdr: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      rawItems: [],
      items: [],
      orderNote: "",
      isDrawerOpen: false,
      isValidating: false,
      serverSubtotalIdr: 0,
      hasIssues: false,

      addItem: (item, qty = 1) => {
        const vId = item.variantId || item.id || "";
        if (!vId) return;

        set((state) => {
          const existing = state.rawItems.find((i) => i.variantId === vId);
          let updatedRaw: StoredCartItem[];
          if (existing) {
            updatedRaw = state.rawItems.map((i) =>
              i.variantId === vId ? { ...i, quantity: i.quantity + qty } : i
            );
          } else {
            updatedRaw = [...state.rawItems, { variantId: vId, quantity: qty }];
          }

          // Optimistic local item representation if not yet validated
          const existingDisplay = state.items.find((i) => i.variantId === vId);
          let updatedDisplay: CartItem[];
          if (existingDisplay) {
            updatedDisplay = state.items.map((i) =>
              i.variantId === vId
                ? {
                    ...i,
                    quantity: i.quantity + qty,
                    lineTotalIdr: i.priceIdr * (i.quantity + qty),
                  }
                : i
            );
          } else {
            const newItem: CartItem = {
              id: vId,
              variantId: vId,
              sku: item.variantSku || item.sku || vId,
              slug: item.productSlug || item.slug || "",
              productSlug: item.productSlug || item.slug || "",
              name: item.name || "Produk",
              brand: item.brand || "",
              variantSku: item.variantSku || item.sku || vId,
              variantName: item.variantName || item.variantLabel || "",
              priceIdr: item.priceIdr || 0,
              compareAtPriceIdr: item.compareAtPriceIdr || null,
              quantity: qty,
              lineTotalIdr: (item.priceIdr || 0) * qty,
              stock: item.maxStock || item.stock || 99,
              maxStock: item.maxStock || item.stock || 99,
              stockStatus: (item.stockStatus as any) || "in_stock",
              issue: null,
              imageUrl: item.imageUrl || "",
            };
            updatedDisplay = [...state.items, newItem];
          }

          return {
            rawItems: updatedRaw,
            items: updatedDisplay,
            isDrawerOpen: true,
          };
        });

        // Trigger authoritative validation in background
        get().validateWithServer();
      },

      removeItem: (idOrVariantId: string) => {
        set((state) => ({
          rawItems: state.rawItems.filter(
            (i) => i.variantId !== idOrVariantId
          ),
          items: state.items.filter(
            (i) => i.id !== idOrVariantId && i.variantId !== idOrVariantId
          ),
        }));
        get().validateWithServer();
      },

      updateQuantity: (idOrVariantId: string, deltaOrExact: number, isAbsolute = false) => {
        set((state) => {
          const rawItem = state.rawItems.find(
            (i) => i.variantId === idOrVariantId
          );
          if (!rawItem) return state;

          const newQty = isAbsolute ? deltaOrExact : rawItem.quantity + deltaOrExact;
          if (newQty <= 0) {
            return {
              rawItems: state.rawItems.filter((i) => i.variantId !== idOrVariantId),
              items: state.items.filter((i) => i.variantId !== idOrVariantId && i.id !== idOrVariantId),
            };
          }

          const updatedRaw = state.rawItems.map((i) =>
            i.variantId === idOrVariantId ? { ...i, quantity: newQty } : i
          );
          const updatedItems = state.items.map((i) =>
            i.variantId === idOrVariantId || i.id === idOrVariantId
              ? {
                  ...i,
                  quantity: newQty,
                  lineTotalIdr: i.priceIdr * newQty,
                }
              : i
          );

          return {
            rawItems: updatedRaw,
            items: updatedItems,
          };
        });

        get().validateWithServer();
      },

      setOrderNote: (note: string) => set({ orderNote: note }),

      clearCart: () =>
        set({
          rawItems: [],
          items: [],
          orderNote: "",
          serverSubtotalIdr: 0,
          hasIssues: false,
        }),

      openDrawer: () => {
        set({ isDrawerOpen: true });
        get().validateWithServer();
      },

      closeDrawer: () => set({ isDrawerOpen: false }),

      toggleDrawer: () => {
        const next = !get().isDrawerOpen;
        set({ isDrawerOpen: next });
        if (next) {
          get().validateWithServer();
        }
      },

      setValidationResult: (res: CartValidateResponse) => {
        const mappedItems: CartItem[] = res.lines.map((line) => ({
          id: line.variantId,
          variantId: line.variantId,
          sku: line.sku,
          slug: line.productSlug,
          productSlug: line.productSlug,
          name: line.name,
          brand: line.brand,
          variantSku: line.sku,
          variantName: line.variantLabel,
          priceIdr: Number(line.unitPriceIdr),
          quantity: line.quantity,
          lineTotalIdr: Number(line.lineTotalIdr),
          stock: line.stock,
          maxStock: line.stock,
          stockStatus: line.stockStatus as any,
          issue: line.issue as any,
          imageUrl: line.imageUrl || "",
        }));

        set({
          items: mappedItems,
          serverSubtotalIdr: Number(res.subtotalIdr),
          hasIssues: res.hasIssues,
          isValidating: false,
        });
      },

      validateWithServer: async () => {
        const raw = get().rawItems;
        if (raw.length === 0) {
          set({ items: [], serverSubtotalIdr: 0, hasIssues: false, isValidating: false });
          return null;
        }

        set({ isValidating: true });
        try {
          const res = await api.validateCart({
            items: raw.map((r) => ({
              variantId: r.variantId,
              quantity: r.quantity,
            })),
          });
          get().setValidationResult(res);
          return res;
        } catch {
          set({ isValidating: false });
          return null;
        }
      },

      totalCount: () => {
        return get().rawItems.reduce((acc, i) => acc + i.quantity, 0);
      },

      subtotalIdr: () => {
        const serverSubtotal = get().serverSubtotalIdr;
        if (serverSubtotal > 0) return serverSubtotal;
        return get().items.reduce((acc, i) => acc + i.lineTotalIdr, 0);
      },
    }),
    {
      name: "gmc_cart_v2",
      partialize: (state) => ({
        rawItems: state.rawItems,
        orderNote: state.orderNote,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Immediately validate rehydrated cart lines with backend
          state.validateWithServer();
        }
      },
    }
  )
);
