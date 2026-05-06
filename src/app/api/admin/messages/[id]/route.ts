import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const { id } = await params;

  const existing = await prisma.contactMessage.findUnique({ where: { id } });

  if (!existing) {
    return jsonError("Message not found.", 404);
  }

  const message = await prisma.contactMessage.update({
    where: { id },
    data: { isRead: true },
  });

  return jsonSuccess(message);
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

  const existing = await prisma.contactMessage.findUnique({ where: { id } });

  if (!existing) {
    return jsonError("Message not found.", 404);
  }

  await prisma.contactMessage.delete({ where: { id } });

  return jsonSuccess({ deleted: true });
}
