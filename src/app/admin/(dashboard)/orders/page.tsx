import { AdminOrdersClient } from "@/components/admin/orders-client";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Admin Orders",
  description: "Review and update customer orders.",
  path: "/admin/orders",
});

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
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
    id: order.id,
    email: order.email,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    user: order.user,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      product: {
        id: item.product.id,
        name: item.product.name,
        featuredImage: item.product.featuredImage,
        images: item.product.images.map((image) => image.media),
      },
    })),
  }));

  return <AdminOrdersClient orders={formatted} />;
}
