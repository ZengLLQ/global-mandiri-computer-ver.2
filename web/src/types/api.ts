import type { components } from "@/lib/api/schema";

export type SchemaCategory = components["schemas"]["Category"];
export type SchemaBrand = components["schemas"]["Brand"];
export type SchemaProductCard = components["schemas"]["ProductCard"];
export type SchemaProductDetail = components["schemas"]["ProductDetail"];
export type SchemaOrder = components["schemas"]["Order"];
export type SchemaUser = components["schemas"]["User"];
export type SchemaAddress = components["schemas"]["Address"];

export interface Category {
  id: string;
  slug: string;
  name: string;
  parentSlug?: string | null;
  parentId?: string | null;
  productCount?: number;
  sortOrder?: number;
  description?: string;
}

export interface Brand {
  id: string;
  slug?: string;
  name: string;
  productCount?: number;
}

export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  brand: string | { id: string; slug: string; name: string; productCount?: number };
  category: string | { id: string; slug: string; name: string; parentSlug?: string | null; productCount?: number };
  summary?: string;
  priceFromIdr?: number;
  priceToIdr?: number;
  minPriceIdr?: number;
  minPriceIDR?: number;
  compareAtPriceFromIdr?: number | null;
  compareAtPriceIdr?: number | null;
  compareAtPriceIDR?: number | null;
  primaryImage?: { url: string; alt?: string | null } | null;
  primaryImageUrl?: string;
  secondaryImage?: { url: string; alt?: string | null } | null;
  secondaryImageUrl?: string | null;
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock" | "preorder";
  isReady?: boolean;
  isFeatured?: boolean;
  hasVariants?: boolean;
}

export interface ProductImage {
  url: string;
  alt: string;
}

export interface ProductOptionValue {
  id: string;
  label: string;
  swatchHex?: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  display?: "pill" | "swatch";
  values: string[] | ProductOptionValue[] | any[];
}

export interface Variant {
  id: string;
  sku: string;
  optionValues?: Record<string, string>;
  optionValueIds?: string[];
  priceIdr: number;
  priceIDR?: number;
  compareAtPriceIdr?: number | null;
  compareAtPriceIDR?: number | null;
  stock: number;
  status?: "ready" | "preorder" | "habis";
  stockStatus?: "in_stock" | "low_stock" | "preorder" | "out_of_stock";
  imageUrl?: string | null;
}

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  brand: string | { id: string; slug: string; name: string; productCount?: number };
  category: string | { id: string; slug: string; name: string; parentSlug?: string | null; productCount?: number };
  description: string;
  specs: Record<string, string>;
  images: ProductImage[];
  options: ProductOption[];
  variants: Variant[];
  crossSells?: ProductCard[];
  whatsappUrl?: string;
}

export interface ProductListResponse {
  items: ProductCard[];
  total: number;
  page: number;
  pageSize?: number;
  totalPages: number;
  facets?: any;
}

export interface CartValidateItem {
  variantId: string;
  quantity: number;
}

export interface CartValidateRequest {
  items: CartValidateItem[];
}

export interface CartValidateResponse {
  valid?: boolean;
  hasIssues?: boolean;
  subtotalIdr: number;
  lines?: any[];
  items?: {
    variantId: string;
    sku: string;
    productName: string;
    priceIdr: number;
    quantity: number;
    maxStock: number;
    isAvailable: boolean;
  }[];
}

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface CheckoutRequest {
  customer?: {
    name: string;
    phone: string;
    email: string;
  };
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryMethod: "pickup" | "delivery";
  shippingAddress?: ShippingAddress;
  paymentMethod: "bank_transfer" | "cod" | "store_payment" | "pay_at_store";
  note?: string | null;
  expectedSubtotalIdr?: number | null;
  items: {
    variantId: string;
    quantity: number;
  }[];
}

export interface CheckoutResponse {
  order: SchemaOrder;
  orderNo?: string;
  totalIdr?: number;
  whatsappUrl?: string;
  viewToken?: string | null;
}

export interface OrderItem {
  id?: string;
  variantId?: string | null;
  productSlug?: string;
  sku?: string;
  name?: string;
  productName?: string;
  brand?: string;
  variantLabel?: string;
  variantSku?: string;
  optionsSummary?: string;
  imageUrl?: string | null;
  unitPriceIdr?: number;
  priceIdr?: number;
  quantity: number;
  lineTotalIdr?: number;
}

export interface OrderStatusHistoryItem {
  status: string;
  note?: string | null;
  createdAt: string;
}

export interface OrderDetail {
  id?: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryMethod: string;
  shippingAddress?: ShippingAddress | null;
  paymentMethod: string;
  note?: string | null;
  subtotalIdr: number;
  shippingIdr: number;
  totalIdr: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  history?: OrderStatusHistoryItem[];
  statusHistory?: OrderStatusHistoryItem[];
  whatsappUrl?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin";
}

export interface Address {
  id: string;
  label?: string | null;
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

export interface AddressInput {
  label?: string | null;
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault?: boolean;
}

export interface UserOrderListResponse {
  items: any[];
  orders?: OrderDetail[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}
