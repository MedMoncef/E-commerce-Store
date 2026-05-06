import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";
import { productSchema } from "@/lib/validators";

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      brand: { select: { id: true, name: true, slug: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  return jsonSuccess(products);
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid product payload.");
  }

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      isActive: parsed.data.isActive ?? true,
    },
  });

  return jsonSuccess(product, { status: 201 });
}
