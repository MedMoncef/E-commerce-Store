import { NextRequest } from "next/server";

import type { OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { jsonError, jsonSuccess, requireUser } from "@/lib/api-helpers";
import { orderCreateSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = orderCreateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid order data.");
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const orderEmail =
    session?.user?.email ||
    parsed.data.email ||
    parsed.data.shipping.email ||
    null;

  if (!userId && !orderEmail) {
    return jsonError("Email is required for guest checkout.");
  }

  const productIds = parsed.data.items.map((item) => item.productId);
  type ProductSnapshot = { id: string; stock: number; price: number };

  const products: ProductSnapshot[] = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, stock: true, price: true },
  });

  if (products.length !== parsed.data.items.length) {
    return jsonError("One or more products are unavailable.");
  }

  const productMap = new Map<string, ProductSnapshot>(
    products.map((product) => [product.id, product])
  );

  for (const item of parsed.data.items) {
    const product = productMap.get(item.productId);
    if (!product || product.stock < item.quantity) {
      return jsonError("Insufficient stock for one or more items.");
    }
  }

  const total = parsed.data.items.reduce((sum, item) => {
    const product = productMap.get(item.productId);
    return sum + (product?.price ?? 0) * item.quantity;
  }, 0);

  const order = await prisma.order.create({
    data: {
      email: orderEmail,
      status: "PENDING",
      total,
      shippingAddress: parsed.data.shipping,
      userId,
      items: {
        create: parsed.data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: productMap.get(item.productId)?.price ?? 0,
        })),
      },
    },
  });

  return jsonSuccess({ id: order.id });
}

export async function GET(request: NextRequest) {
  const { response, session } = await requireUser();

  if (response) {
    return response;
  }

  const status = request.nextUrl.searchParams.get("status");
  const allowed = [
    "PENDING",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ] as const;

  if (status && !allowed.includes(status as (typeof allowed)[number])) {
    return jsonError("Invalid status filter.");
  }

  const parsedStatus =
    status && allowed.includes(status as (typeof allowed)[number])
      ? (status as OrderStatus)
      : undefined;

  const orders = await prisma.order.findMany({
    where: {
      userId: session.user.id,
      status: parsedStatus,
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, images: true } },
        },
      },
    },
  });

  return jsonSuccess(orders);
}
