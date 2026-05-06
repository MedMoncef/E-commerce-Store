import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";
import { brandSchema } from "@/lib/validators";

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
  const parsed = brandSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid brand payload.");
  }

  const existing = await prisma.brand.findUnique({ where: { id } });

  if (!existing) {
    return jsonError("Brand not found.", 404);
  }

  const brand = await prisma.brand.update({
    where: { id },
    data: parsed.data,
  });

  return jsonSuccess(brand);
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

  const existing = await prisma.brand.findUnique({ where: { id } });

  if (!existing) {
    return jsonError("Brand not found.", 404);
  }

  await prisma.brand.delete({ where: { id } });

  return jsonSuccess({ deleted: true });
}
