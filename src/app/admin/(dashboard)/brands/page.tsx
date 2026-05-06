import { AdminBrandsClient } from "@/components/admin/brands-client";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Admin Brands",
  description: "Manage brand taxonomy for your catalog.",
  path: "/admin/brands",
});

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
  return <AdminBrandsClient brands={brands} />;
}
