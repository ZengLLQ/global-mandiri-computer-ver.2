import React from "react";
import { Metadata } from "next";
import { OrderSuccessClient } from "@/components/checkout/OrderSuccessClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}): Promise<Metadata> {
  const { orderNo } = await params;
  return {
    title: `Pesanan ${orderNo} Berhasil | Global Mandiri Computer`,
    description: `Konfirmasi pesanan ${orderNo} di Global Mandiri Computer ITC Mega Grosir Surabaya.`,
  };
}

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const { orderNo } = await params;
  return <OrderSuccessClient orderNo={orderNo} />;
}
