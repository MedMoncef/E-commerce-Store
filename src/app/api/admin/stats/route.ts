import { prisma } from "@/lib/prisma";
import { jsonSuccess, requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const [totalProducts, totalOrders, revenue, recentOrders] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

  return jsonSuccess({
    totalProducts,
    totalOrders,
    totalRevenue: revenue._sum.total ?? 0,
    recentOrders,
  });
}
