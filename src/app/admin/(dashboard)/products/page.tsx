import { AdminProductsClient } from "@/components/admin/products-client";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Admin Products",
  description: "Manage product catalog listings.",
  path: "/admin/products",
});

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, brands, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <AdminProductsClient
      products={products}
      brands={brands}
      categories={categories}
    />
  );
}
