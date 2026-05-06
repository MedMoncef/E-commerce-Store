import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Admin Dashboard",
  description: "Overview of store performance and recent orders.",
  path: "/admin",
});

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  type RecentOrder = {
    id: string;
    total: number;
    email: string | null;
    createdAt: Date;
    user: { name: string | null; email: string | null } | null;
  };

  const [totalProducts, totalOrders, revenue, recentOrders]: [
    number,
    number,
    { _sum: { total: number | null } },
    RecentOrder[]
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Dashboard
        </p>
        <h1 className="heading-font text-3xl font-semibold">
          Store overview
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalProducts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatCurrency(revenue._sum.total ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Recent orders</h2>
        <div className="mt-4 space-y-4 text-sm">
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground">No orders yet.</p>
          ) : (
            recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <p className="font-medium">Order #{order.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.user?.email || order.email || "Guest"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatCurrency(order.total)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
