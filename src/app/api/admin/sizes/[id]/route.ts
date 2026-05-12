import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";
import { sizeSchema } from "@/lib/validators";

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
  const parsed = sizeSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid size payload.");
  }

  const existing = await prisma.size.findUnique({ where: { id } });

  if (!existing) {
    return jsonError("Size not found.", 404);
  }

  const size = await prisma.size.update({
    where: { id },
    data: parsed.data,
  });

  return jsonSuccess(size);
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

  const existing = await prisma.size.findUnique({ where: { id } });

  if (!existing) {
    return jsonError("Size not found.", 404);
  }

  await prisma.size.delete({ where: { id } });

  return jsonSuccess({ deleted: true });
}
