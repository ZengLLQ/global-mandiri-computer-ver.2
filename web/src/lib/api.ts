import { apiClient, parseApiResponse } from "./api/client";
import { mapProductCard, mapProductDetail } from "./api/mappers";
import type { paths } from "./api/schema";

export type Category = paths["/v1/categories"]["get"]["responses"]["200"]["content"]["application/json"][number];
export type Brand = paths["/v1/brands"]["get"]["responses"]["200"]["content"]["application/json"][number];
export type ProductCard = paths["/v1/products"]["get"]["responses"]["200"]["content"]["application/json"]["items"][number];
export type ProductDetail = paths["/v1/products/{slug}"]["get"]["responses"]["200"]["content"]["application/json"];
export type ProductListResponse = paths["/v1/products"]["get"]["responses"]["200"]["content"]["application/json"];
export type CartValidateRequest = paths["/v1/cart/validate"]["post"]["requestBody"]["content"]["application/json"];
export type CartValidateResponse = paths["/v1/cart/validate"]["post"]["responses"]["200"]["content"]["application/json"];
export type CheckoutRequest = paths["/v1/checkout"]["post"]["requestBody"]["content"]["application/json"];
export type CheckoutResponse = paths["/v1/checkout"]["post"]["responses"]["201"]["content"]["application/json"];
export type OrderDetail = paths["/v1/orders/{orderNo}"]["get"]["responses"]["200"]["content"]["application/json"];
export type UserProfile = paths["/v1/me"]["get"]["responses"]["200"]["content"]["application/json"];
export type Address = paths["/v1/me/addresses"]["get"]["responses"]["200"]["content"]["application/json"][number];
export type AddressInput = paths["/v1/me/addresses"]["post"]["requestBody"]["content"]["application/json"];

export const api = {
  // Categories & Brands
  async getCategories(): Promise<Category[]> {
    const { data, error, response } = await apiClient.GET("/v1/categories");
    return parseApiResponse(data, error, response);
  },

  async getBrands(): Promise<Brand[]> {
    const { data, error, response } = await apiClient.GET("/v1/brands");
    return parseApiResponse(data, error, response);
  },

  // Products
  async getProducts(params: any = {}): Promise<ProductListResponse> {
    const qParams: any = {};
    if (params.page !== undefined) qParams.page = Number(params.page);
    if (params.pageSize !== undefined) qParams.pageSize = Number(params.pageSize);
    else if (params.limit !== undefined) qParams.pageSize = Number(params.limit);

    if (params.q) qParams.q = params.q;
    if (params.sort) qParams.sort = params.sort;
    if (params.inStock !== undefined) qParams.inStock = Boolean(params.inStock);

    if (params.minPriceIdr !== undefined) qParams.minPriceIdr = Number(params.minPriceIdr);
    else if (params.min !== undefined) qParams.minPriceIdr = Number(params.min);

    if (params.maxPriceIdr !== undefined) qParams.maxPriceIdr = Number(params.maxPriceIdr);
    else if (params.max !== undefined) qParams.maxPriceIdr = Number(params.max);

    if (params.category) {
      qParams.category = Array.isArray(params.category) ? params.category : [params.category];
    }
    if (params.brand) {
      qParams.brand = Array.isArray(params.brand) ? params.brand : [params.brand];
    }

    const { data, error, response } = await apiClient.GET("/v1/products", {
      params: { query: qParams },
    });
    const res = parseApiResponse(data, error, response) as any;
    if (res && Array.isArray(res.items)) {
      res.items = res.items.map(mapProductCard);
    }
    return res;
  },

  async getProductBySlug(slug: string): Promise<ProductDetail> {
    const { data, error, response } = await apiClient.GET("/v1/products/{slug}", {
      params: { path: { slug } },
    });
    const res = parseApiResponse(data, error, response) as any;
    return mapProductDetail(res);
  },

  // Cart
  async validateCart(data: CartValidateRequest): Promise<CartValidateResponse> {
    const { data: resData, error, response } = await apiClient.POST("/v1/cart/validate", {
      body: data,
    });
    return parseApiResponse(resData, error, response);
  },

  // Checkout & Orders
  async checkout(data: CheckoutRequest, idempotencyKey?: string): Promise<CheckoutResponse> {
    const key = idempotencyKey || (typeof crypto !== "undefined" ? crypto.randomUUID() : "client-key");
    const { data: resData, error, response } = await apiClient.POST("/v1/checkout", {
      params: {
        header: {
          "Idempotency-Key": key,
        },
      },
      body: data,
    });
    return parseApiResponse(resData, error, response);
  },

  async getOrder(orderNo: string, viewToken?: string): Promise<OrderDetail> {
    const headers: Record<string, string> = {};
    if (viewToken) {
      headers["X-Order-Token"] = viewToken;
    }
    const { data, error, response } = await apiClient.GET("/v1/orders/{orderNo}", {
      params: { path: { orderNo } },
      headers,
    });
    return parseApiResponse(data, error, response);
  },

  // Auth & Account
  async register(data: paths["/v1/auth/register"]["post"]["requestBody"]["content"]["application/json"]): Promise<{ user: UserProfile }> {
    const { data: resData, error, response } = await apiClient.POST("/v1/auth/register", {
      body: data,
    });
    return parseApiResponse(resData, error, response);
  },

  async login(data: paths["/v1/auth/login"]["post"]["requestBody"]["content"]["application/json"]): Promise<{ user: UserProfile }> {
    const { data: resData, error, response } = await apiClient.POST("/v1/auth/login", {
      body: data,
    });
    return parseApiResponse(resData, error, response);
  },

  async logout(): Promise<void> {
    const { error, response } = await apiClient.POST("/v1/auth/logout");
    if (error) {
      parseApiResponse(undefined, error, response);
    }
  },

  async forgotPassword(email: string): Promise<void> {
    const { error, response } = await apiClient.POST("/v1/auth/forgot-password", {
      body: { email },
    });
    if (error) {
      parseApiResponse(undefined, error, response);
    }
  },

  async getMe(): Promise<UserProfile> {
    const { data, error, response } = await apiClient.GET("/v1/me");
    return parseApiResponse(data, error, response);
  },

  async updateMe(data: paths["/v1/me"]["patch"]["requestBody"]["content"]["application/json"]): Promise<UserProfile> {
    const { data: resData, error, response } = await apiClient.PATCH("/v1/me", {
      body: data,
    });
    return parseApiResponse(resData, error, response);
  },

  async changePassword(data: paths["/v1/me/password"]["put"]["requestBody"]["content"]["application/json"]): Promise<void> {
    const { error, response } = await apiClient.PUT("/v1/me/password", {
      body: data,
    });
    if (error) {
      parseApiResponse(undefined, error, response);
    }
  },

  async getAddresses(): Promise<Address[]> {
    const { data, error, response } = await apiClient.GET("/v1/me/addresses");
    return parseApiResponse(data, error, response);
  },

  async createAddress(data: AddressInput): Promise<Address> {
    const { data: resData, error, response } = await apiClient.POST("/v1/me/addresses", {
      body: data,
    });
    return parseApiResponse(resData, error, response);
  },

  async setDefaultAddress(id: string): Promise<Address> {
    const { data, error, response } = await apiClient.PATCH("/v1/me/addresses/{id}", {
      params: { path: { id } },
      body: { isDefault: true },
    });
    return parseApiResponse(data, error, response);
  },

  async deleteAddress(id: string): Promise<void> {
    const { error, response } = await apiClient.DELETE("/v1/me/addresses/{id}", {
      params: { path: { id } },
    });
    if (error) {
      parseApiResponse(undefined, error, response);
    }
  },

  async getMyOrders(params?: paths["/v1/me/orders"]["get"]["parameters"]["query"]) {
    const { data, error, response } = await apiClient.GET("/v1/me/orders", {
      params: { query: params },
    });
    return parseApiResponse(data, error, response);
  },

  async getWishlist(): Promise<ProductCard[]> {
    const { data, error, response } = await apiClient.GET("/v1/me/wishlist");
    const res = parseApiResponse(data, error, response) as any;
    return Array.isArray(res) ? res.map(mapProductCard) : [];
  },

  async addToWishlist(productId: string): Promise<void> {
    const { error, response } = await apiClient.PUT("/v1/me/wishlist/{productId}", {
      params: { path: { productId } },
    });
    if (error) {
      parseApiResponse(undefined, error, response);
    }
  },

  async removeFromWishlist(productId: string): Promise<void> {
    const { error, response } = await apiClient.DELETE("/v1/me/wishlist/{productId}", {
      params: { path: { productId } },
    });
    if (error) {
      parseApiResponse(undefined, error, response);
    }
  },

  // Contact & Newsletter
  async submitContact(data: paths["/v1/contact"]["post"]["requestBody"]["content"]["application/json"]): Promise<{ whatsappUrl: string }> {
    const { data: resData, error, response } = await apiClient.POST("/v1/contact", {
      body: data,
    });
    return parseApiResponse(resData, error, response);
  },

  async subscribeNewsletter(data: paths["/v1/newsletter"]["post"]["requestBody"]["content"]["application/json"]): Promise<void> {
    const { error, response } = await apiClient.POST("/v1/newsletter", {
      body: data,
    });
    if (error) {
      parseApiResponse(undefined, error, response);
    }
  },
};
