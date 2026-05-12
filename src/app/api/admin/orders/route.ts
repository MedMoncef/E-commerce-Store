import { prisma } from "@/lib/prisma";
import { jsonSuccess, requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              featuredImage: { select: { url: true } },
              images: {
                orderBy: { sortOrder: "asc" },
                select: { media: { select: { url: true } } },
              },
            },
          },
        },
      },
    },
  });

  const formatted = orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        images: item.product.images.map((image) => image.media),
      },
    })),
  }));

  return jsonSuccess(formatted);
}
