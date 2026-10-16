import { useQuery } from "@tanstack/react-query";
import { apiClient, parseApiResponse } from "../client";
import type { paths } from "../schema";

export type ProductFilterParams = paths["/v1/products"]["get"]["parameters"]["query"];

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error, response } = await apiClient.GET("/v1/categories");
      return parseApiResponse(data, error, response);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error, response } = await apiClient.GET("/v1/brands");
      return parseApiResponse(data, error, response);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProducts(filter?: ProductFilterParams) {
  return useQuery({
    queryKey: ["products", filter],
    queryFn: async () => {
      const { data, error, response } = await apiClient.GET("/v1/products", {
        params: {
          query: filter,
        },
      });
      return parseApiResponse(data, error, response);
    },
    staleTime: 60 * 1000,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error, response } = await apiClient.GET("/v1/products/{slug}", {
        params: {
          path: { slug },
        },
      });
      return parseApiResponse(data, error, response);
    },
    enabled: Boolean(slug),
    staleTime: 60 * 1000,
  });
}
