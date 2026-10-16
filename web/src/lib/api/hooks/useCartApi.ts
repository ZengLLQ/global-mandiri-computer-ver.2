import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient, parseApiResponse } from "../client";
import type { paths } from "../schema";

export type CartItemInput = paths["/v1/cart/validate"]["post"]["requestBody"]["content"]["application/json"]["items"][number];

export function useValidateCart(items: CartItemInput[], enabled: boolean = true) {
  return useQuery({
    queryKey: ["cart", "validate", items],
    queryFn: async () => {
      const { data, error, response } = await apiClient.POST("/v1/cart/validate", {
        body: { items },
      });
      return parseApiResponse(data, error, response);
    },
    enabled: enabled && items.length > 0,
    staleTime: 10 * 1000, // 10 seconds
  });
}

export function useServerCart(enabled: boolean = false) {
  return useQuery({
    queryKey: ["cart", "server"],
    queryFn: async () => {
      const { data, error, response } = await apiClient.GET("/v1/me/cart");
      return parseApiResponse(data, error, response);
    },
    enabled,
  });
}

export function useMergeCartMutation() {
  return useMutation({
    mutationFn: async (items: CartItemInput[]) => {
      const { data, error, response } = await apiClient.POST("/v1/me/cart/merge", {
        body: { items },
      });
      return parseApiResponse(data, error, response);
    },
  });
}

export function useSaveServerCartMutation() {
  return useMutation({
    mutationFn: async (items: CartItemInput[]) => {
      const { data, error, response } = await apiClient.PUT("/v1/me/cart", {
        body: { items },
      });
      return parseApiResponse(data, error, response);
    },
  });
}
