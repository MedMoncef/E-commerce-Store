import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return buildMetadata({
    title: "Order confirmation",
    description: `Order ${id} has been confirmed.`,
    path: `/order-confirmation/${id}`,
  });
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { createdAt: true },
  });
  const createdAt = order?.createdAt ?? new Date();
  const dateStamp = createdAt.toISOString().slice(0, 10).replace(/-/g, "");
  const shortId = id.slice(-6).toUpperCase();
  const orderRef = `ORD-${dateStamp}-${shortId}`;
  const placedOn = createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Order confirmed
      </p>
      <h1 className="heading-font mt-3 text-3xl font-semibold">
        Thank you for your purchase.
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Your order reference{" "}
        <span className="font-semibold text-foreground">{orderRef}</span> is
        being prepared. We will send a confirmation email with tracking updates.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Order ID: <span className="font-semibold text-foreground">{id}</span> -
        Placed {placedOn}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/products">Continue shopping</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/account">View your account</Link>
        </Button>
      </div>
    </div>
  );
}
