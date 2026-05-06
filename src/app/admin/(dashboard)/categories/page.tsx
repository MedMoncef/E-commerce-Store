import { AdminCategoriesClient } from "@/components/admin/categories-client";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Admin Categories",
  description: "Manage product categories for the storefront.",
  path: "/admin/categories",
});

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return <AdminCategoriesClient categories={categories} />;
}
