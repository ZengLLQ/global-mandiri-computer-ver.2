import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient, parseApiResponse } from "../client";
import type { paths } from "../schema";

export type CheckoutInput = paths["/v1/checkout"]["post"]["requestBody"]["content"]["application/json"];

export function useCheckoutMutation() {
  return useMutation({
    mutationFn: async ({
      payload,
      idempotencyKey,
    }: {
      payload: CheckoutInput;
      idempotencyKey: string;
    }) => {
      const { data, error, response } = await apiClient.POST("/v1/checkout", {
        params: {
          header: {
            "Idempotency-Key": idempotencyKey,
          },
        },
        body: payload,
      });
      return parseApiResponse(data, error, response);
    },
  });
}

export function useOrder(orderNo: string, viewToken?: string | null) {
  return useQuery({
    queryKey: ["order", orderNo, viewToken],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (viewToken) {
        headers["X-Order-Token"] = viewToken;
      }
      const { data, error, response } = await apiClient.GET("/v1/orders/{orderNo}", {
        params: {
          path: { orderNo },
        },
        headers,
      });
      return parseApiResponse(data, error, response);
    },
    enabled: Boolean(orderNo),
    retry: 1,
  });
}

