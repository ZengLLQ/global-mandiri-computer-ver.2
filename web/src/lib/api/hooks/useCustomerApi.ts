import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, parseApiResponse } from "../client";
import type { paths } from "../schema";

export type AddressInput = paths["/v1/me/addresses"]["post"]["requestBody"]["content"]["application/json"];
export type AddressPatchInput = paths["/v1/me/addresses/{id}"]["patch"]["requestBody"]["content"]["application/json"];
export type ProfilePatchInput = paths["/v1/me"]["patch"]["requestBody"]["content"]["application/json"];

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProfilePatchInput) => {
      const { data, error, response } = await apiClient.PATCH("/v1/me", {
        body: payload,
      });
      return parseApiResponse(data, error, response);
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["auth", "me"], updatedUser);
    },
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data, error, response } = await apiClient.GET("/v1/me/addresses");
      return parseApiResponse(data, error, response);
    },
  });
}

export function useCreateAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddressInput) => {
      const { data, error, response } = await apiClient.POST("/v1/me/addresses", {
        body: payload,
      });
      return parseApiResponse(data, error, response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useUpdateAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: AddressPatchInput }) => {
      const { data, error, response } = await apiClient.PATCH("/v1/me/addresses/{id}", {
        params: { path: { id } },
        body: payload,
      });
      return parseApiResponse(data, error, response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useDeleteAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error, response } = await apiClient.DELETE("/v1/me/addresses/{id}", {
        params: { path: { id } },
      });
      return parseApiResponse(data, error, response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useMyOrders(params?: paths["/v1/me/orders"]["get"]["parameters"]["query"]) {
  return useQuery({
    queryKey: ["my-orders", params],
    queryFn: async () => {
      const { data, error, response } = await apiClient.GET("/v1/me/orders", {
        params: { query: params },
      });
      return parseApiResponse(data, error, response);
    },
  });
}

export function useWishlist() {
  return useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const { data, error, response } = await apiClient.GET("/v1/me/wishlist");
      return parseApiResponse(data, error, response);
    },
  });
}

export function useAddToWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { data, error, response } = await apiClient.PUT("/v1/me/wishlist/{productId}", {
        params: { path: { productId } },
      });
      return parseApiResponse(data, error, response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

export function useRemoveFromWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { data, error, response } = await apiClient.DELETE("/v1/me/wishlist/{productId}", {
        params: { path: { productId } },
      });
      return parseApiResponse(data, error, response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}
