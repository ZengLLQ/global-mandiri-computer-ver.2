import React from "react";
import { Metadata } from "next";
import { OrderDetailClient } from "@/components/account/OrderDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}): Promise<Metadata> {
  const { orderNo } = await params;
  return {
    title: `Pesanan ${orderNo} | Global Mandiri Computer`,
    description: `Rincian dan status pelacakan pesanan ${orderNo} di Global Mandiri Computer.`,
  };
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const { orderNo } = await params;
  return <OrderDetailClient orderNo={orderNo} />;
}
