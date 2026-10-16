import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, parseApiResponse } from "../client";
import type { paths, components } from "../schema";

export type AdminLoginInput = paths["/v1/admin/auth/login"]["post"]["requestBody"]["content"]["application/json"];
export type AdminChangePasswordInput = paths["/v1/admin/account/password"]["put"]["requestBody"]["content"]["application/json"];
export type AdminTotpEnableInput = paths["/v1/admin/account/totp/enable"]["post"]["requestBody"]["content"]["application/json"];
export type AdminTotpDisableInput = paths["/v1/admin/account/totp/disable"]["post"]["requestBody"]["content"]["application/json"];
export type AdminUser = components["schemas"]["AdminUserWithPermissions"];
export type AdminCounters = components["schemas"]["AdminCounters"];

export function useAdminMe() {
  return useQuery({
    queryKey: ["admin", "me"],
    queryFn: async () => {
      const { data, error, response } = await apiClient.GET("/v1/admin/me");
      if (response.status === 401) {
        return null;
      }
      return parseApiResponse(data, error, response);
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useAdminCounters() {
  return useQuery({
    queryKey: ["admin", "counters"],
    queryFn: async () => {
      const { data, error, response } = await apiClient.GET("/v1/admin/counters");
      if (response.status === 401) {
        return null;
      }
      return parseApiResponse(data, error, response);
    },
    refetchInterval: 30 * 1000, // Background poll every 30s
    staleTime: 15 * 1000,
  });
}

export function useAdminLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AdminLoginInput) => {
      const { data, error, response } = await apiClient.POST("/v1/admin/auth/login", {
        body: payload,
      });

      // Special handling for 400 when 2FA is required
      if (response.status === 400 && data && "require2fa" in data && data.require2fa) {
        return {
          require2fa: true as const,
          tempToken: (data as any).tempToken as string,
        };
      }

      const res = parseApiResponse(data, error, response);
      if ("token" in res && res.token && typeof window !== "undefined") {
        localStorage.setItem("gmc_admin_token", res.token);
      }
      return {
        require2fa: false as const,
        token: (res as any).token as string,
        mustChangePassword: (res as any).mustChangePassword as boolean,
        user: (res as any).user as AdminUser,
      };
    },
    onSuccess: (data) => {
      if (!data.require2fa && data.user) {
        queryClient.setQueryData(["admin", "me"], data.user);
        queryClient.invalidateQueries({ queryKey: ["admin", "counters"] });
      }
    },
  });
}

export function useAdminLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error, response } = await apiClient.POST("/v1/admin/auth/logout");
      if (typeof window !== "undefined") {
        localStorage.removeItem("gmc_admin_token");
      }
      return parseApiResponse(data, error, response);
    },
    onSuccess: () => {
      queryClient.setQueryData(["admin", "me"], null);
      queryClient.clear();
    },
  });
}

export function useAdminChangePasswordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AdminChangePasswordInput) => {
      const { data, error, response } = await apiClient.PUT("/v1/admin/account/password", {
        body: payload,
      });
      return parseApiResponse(data, error, response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "me"] });
    },
  });
}

export function useAdminTotpSetupMutation() {
  return useMutation({
    mutationFn: async () => {
      const { data, error, response } = await apiClient.POST("/v1/admin/account/totp/setup");
      return parseApiResponse(data, error, response);
    },
  });
}

export function useAdminTotpEnableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AdminTotpEnableInput) => {
      const { data, error, response } = await apiClient.POST("/v1/admin/account/totp/enable", {
        body: payload,
      });
      return parseApiResponse(data, error, response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "me"] });
    },
  });
}

export function useAdminTotpDisableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AdminTotpDisableInput) => {
      const { data, error, response } = await apiClient.POST("/v1/admin/account/totp/disable", {
        body: payload,
      });
      return parseApiResponse(data, error, response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "me"] });
    },
  });
}
