import createClient, { Middleware } from "openapi-fetch";
import type { paths } from "./schema";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public requestId?: string,
    public fields?: Record<string, string>,
    public status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const getBaseUrl = (): string => {
  if (typeof window === "undefined") {
    return process.env.API_INTERNAL_URL || "http://api:8080";
  }
  return "/api";
};

let refreshPromise: Promise<boolean> | null = null;
let adminRefreshPromise: Promise<boolean> | null = null;

const doRefreshToken = async (client: ReturnType<typeof createClient<paths>>): Promise<boolean> => {
  try {
    const { error } = await client.POST("/v1/auth/refresh");
    return !error;
  } catch {
    return false;
  } finally {
    refreshPromise = null;
  }
};

const doAdminRefreshToken = async (client: ReturnType<typeof createClient<paths>>): Promise<boolean> => {
  try {
    const { data, error } = await client.POST("/v1/admin/auth/refresh");
    if (!error && data?.token && typeof window !== "undefined") {
      localStorage.setItem("gmc_admin_token", data.token);
      return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    adminRefreshPromise = null;
  }
};

const requestHeadersMiddleware: Middleware = {
  async onRequest({ request }) {
    request.headers.set("X-Requested-With", "gmc-web");
    if (typeof window !== "undefined") {
      const adminToken = localStorage.getItem("gmc_admin_token");
      if (adminToken && request.url.includes("/admin/")) {
        request.headers.set("Authorization", `Bearer ${adminToken}`);
      }
    }
    return request;
  },
};

const authRefreshMiddleware: Middleware = {
  async onResponse({ response, request }) {
    if (response.status === 401) {
      // Clone response to inspect error envelope
      try {
        const cloned = response.clone();
        const json = await cloned.json();
        if (json?.error?.code === "token_expired") {
          const isAdminReq = request.url.includes("/admin/");

          // Prevent infinite loop if the refresh endpoint itself failed
          if (request.url.includes("/v1/auth/refresh") || request.url.includes("/v1/admin/auth/refresh")) {
            return undefined;
          }

          if (isAdminReq) {
            if (!adminRefreshPromise) {
              adminRefreshPromise = doAdminRefreshToken(apiClient);
            }
            const refreshed = await adminRefreshPromise;
            if (refreshed) {
              const adminToken = localStorage.getItem("gmc_admin_token");
              const newHeaders = new Headers(request.headers);
              if (adminToken) {
                newHeaders.set("Authorization", `Bearer ${adminToken}`);
              }
              const retryReq = new Request(request, { headers: newHeaders });
              return fetch(retryReq);
            }
          } else {
            if (!refreshPromise) {
              refreshPromise = doRefreshToken(apiClient);
            }
            const refreshed = await refreshPromise;
            if (refreshed) {
              // Retry the original request
              return fetch(request);
            }
          }
        }
      } catch {
        // Response wasn't json or failed to parse, continue normally
      }
    }
    return undefined;
  },
};

export const apiClient = createClient<paths>({
  baseUrl: getBaseUrl(),
});

apiClient.use(requestHeadersMiddleware);
apiClient.use(authRefreshMiddleware);

export const parseApiResponse = <T>(
  data: T | undefined,
  error: any,
  response?: Response
): T => {
  if (error) {
    const errObj = error?.error || error;
    throw new ApiError(
      errObj?.code || "internal_error",
      errObj?.message || "Terjadi kesalahan pada sistem",
      errObj?.requestId,
      errObj?.fields,
      response?.status
    );
  }
  if (response?.status === 204) {
    return undefined as unknown as T;
  }
  if (data === undefined) {
    throw new ApiError("not_found", "Data tidak ditemukan", undefined, undefined, response?.status);
  }
  return data;
};
