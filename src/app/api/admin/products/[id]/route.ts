import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";
import { productSchema } from "@/lib/validators";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid product payload.");
  }

  const existing = await prisma.product.findUnique({ where: { id } });

  if (!existing) {
    return jsonError("Product not found.", 404);
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...parsed.data,
      isActive: parsed.data.isActive ?? true,
    },
  });

  return jsonSuccess(product);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const { id } = await params;

  const existing = await prisma.product.findUnique({ where: { id } });

  if (!existing) {
    return jsonError("Product not found.", 404);
  }

  await prisma.product.delete({ where: { id } });

  return jsonSuccess({ deleted: true });
}
