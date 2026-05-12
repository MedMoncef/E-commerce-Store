import { AdminColorsClient } from "@/components/admin/colors-client";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Admin Colors",
  description: "Manage product colors for the catalog.",
  path: "/admin/colors",
});

export const dynamic = "force-dynamic";

export default async function AdminColorsPage() {
  const colors = await prisma.color.findMany({ orderBy: { name: "asc" } });
  return <AdminColorsClient colors={colors} />;
}
