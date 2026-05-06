import { prisma } from "@/lib/prisma";
import { jsonSuccess } from "@/lib/api-helpers";

export async function GET() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
  });

  return jsonSuccess(brands);
}
