import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";
import { colorSchema } from "@/lib/validators";

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
  const parsed = colorSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid color payload.");
  }

  const existing = await prisma.color.findUnique({ where: { id } });

  if (!existing) {
    return jsonError("Color not found.", 404);
  }

  const color = await prisma.color.update({
    where: { id },
    data: parsed.data,
  });

  return jsonSuccess(color);
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

  const existing = await prisma.color.findUnique({ where: { id } });

  if (!existing) {
    return jsonError("Color not found.", 404);
  }

  await prisma.color.delete({ where: { id } });

  return jsonSuccess({ deleted: true });
}
