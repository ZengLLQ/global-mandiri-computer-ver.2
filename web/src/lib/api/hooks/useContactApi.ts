import { useMutation } from "@tanstack/react-query";
import { apiClient, parseApiResponse } from "../client";
import type { paths } from "../schema";

export type ContactInput = paths["/v1/contact"]["post"]["requestBody"]["content"]["application/json"];
export type NewsletterInput = paths["/v1/newsletter"]["post"]["requestBody"]["content"]["application/json"];

export function useContactMutation() {
  return useMutation({
    mutationFn: async (payload: ContactInput) => {
      const { data, error, response } = await apiClient.POST("/v1/contact", {
        body: payload,
      });
      return parseApiResponse(data, error, response);
    },
  });
}

export function useNewsletterMutation() {
  return useMutation({
    mutationFn: async (payload: NewsletterInput) => {
      const { data, error, response } = await apiClient.POST("/v1/newsletter", {
        body: payload,
      });
      return parseApiResponse(data, error, response);
    },
  });
}
