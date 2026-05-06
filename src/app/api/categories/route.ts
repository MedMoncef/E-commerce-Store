import { prisma } from "@/lib/prisma";
import { jsonSuccess } from "@/lib/api-helpers";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return jsonSuccess(categories);
}
