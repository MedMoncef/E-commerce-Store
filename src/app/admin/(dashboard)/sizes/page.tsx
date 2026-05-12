import { AdminSizesClient } from "@/components/admin/sizes-client";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Admin Sizes",
  description: "Manage product sizes for the catalog.",
  path: "/admin/sizes",
});

export const dynamic = "force-dynamic";

export default async function AdminSizesPage() {
  const sizes = await prisma.size.findMany({ orderBy: { name: "asc" } });
  return <AdminSizesClient sizes={sizes} />;
}
