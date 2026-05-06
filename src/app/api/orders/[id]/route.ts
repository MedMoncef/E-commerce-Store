import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireUser } from "@/lib/api-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response, session } = await requireUser();

  if (response) {
    return response;
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, images: true } },
        },
      },
    },
  });

  if (!order) {
    return jsonError("Order not found.", 404);
  }

  if (session.user.role !== "ADMIN" && order.userId !== session.user.id) {
    return jsonError("Forbidden", 403);
  }

  return jsonSuccess(order);
}
