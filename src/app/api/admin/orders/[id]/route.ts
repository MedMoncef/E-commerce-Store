import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";
import { orderStatusSchema } from "@/lib/validators";

class AdminOrderError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = orderStatusSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid order status.");
  }

  try {
    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new AdminOrderError("Order not found.", 404);
      }

      const shouldConfirm =
        parsed.data.status === "CONFIRMED" && order.status !== "CONFIRMED";

      if (shouldConfirm) {
        const itemsWithProducts = await tx.orderItem.findMany({
          where: { orderId: order.id },
          include: { product: true },
        });

        for (const item of itemsWithProducts) {
          if (item.product.stock < item.quantity) {
            throw new AdminOrderError(
              `Insufficient stock for ${item.product.name}.`,
              400
            );
          }
        }

        for (const item of itemsWithProducts) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return tx.order.update({
        where: { id: order.id },
        data: { status: parsed.data.status },
      });
    });

    return jsonSuccess(updated);
  } catch (error) {
    if (error instanceof AdminOrderError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Unable to update order.", 500);
  }
}
