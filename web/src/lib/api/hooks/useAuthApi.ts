import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, parseApiResponse } from "../client";
import type { paths } from "../schema";

export type LoginInput = paths["/v1/auth/login"]["post"]["requestBody"]["content"]["application/json"];
export type RegisterInput = paths["/v1/auth/register"]["post"]["requestBody"]["content"]["application/json"];

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data, error, response } = await apiClient.GET("/v1/me");
      if (response.status === 401) {
        return null;
      }
      return parseApiResponse(data, error, response);
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LoginInput) => {
      const { data, error, response } = await apiClient.POST("/v1/auth/login", {
        body: payload,
      });
      return parseApiResponse(data, error, response);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data.user);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RegisterInput) => {
      const { data, error, response } = await apiClient.POST("/v1/auth/register", {
        body: payload,
      });
      return parseApiResponse(data, error, response);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data.user);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error, response } = await apiClient.POST("/v1/auth/logout");
      return parseApiResponse(data, error, response);
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}
