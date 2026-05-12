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
  const [products, brands, categories, sizes, colors] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        featuredImage: { select: { id: true, url: true, originalName: true } },
        images: {
          orderBy: { sortOrder: "asc" },
          select: { media: { select: { id: true, url: true, originalName: true } } },
        },
        sizes: { select: { id: true, name: true, slug: true } },
        colors: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.size.findMany({ orderBy: { name: "asc" } }),
    prisma.color.findMany({ orderBy: { name: "asc" } }),
  ]);

  const formattedProducts = products.map((product) => ({
    ...product,
    images: product.images.map((item) => item.media),
  }));

  return (
    <AdminProductsClient
      products={formattedProducts}
      brands={brands}
      categories={categories}
      sizes={sizes}
      colors={colors}
    />
  );
}
