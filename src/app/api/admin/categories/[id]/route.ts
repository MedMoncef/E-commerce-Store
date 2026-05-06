import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";
import { categorySchema } from "@/lib/validators";

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
  const parsed = categorySchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid category payload.");
  }

  const existing = await prisma.category.findUnique({ where: { id } });

  if (!existing) {
    return jsonError("Category not found.", 404);
  }

  const category = await prisma.category.update({
    where: { id },
    data: parsed.data,
  });

  return jsonSuccess(category);
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

  const existing = await prisma.category.findUnique({ where: { id } });

  if (!existing) {
    return jsonError("Category not found.", 404);
  }

  await prisma.category.delete({ where: { id } });

  return jsonSuccess({ deleted: true });
}
