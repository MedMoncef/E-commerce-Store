import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";
import { adminUserUpdateSchema } from "@/lib/validators";

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
  const parsed = adminUserUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid user payload.");
  }

  const existing = await prisma.user.findUnique({ where: { id } });

  if (!existing) {
    return jsonError("User not found.", 404);
  }

  if (parsed.data.email !== existing.email) {
    const emailInUse = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (emailInUse) {
      return jsonError("Email is already in use.");
    }
  }

  const data: {
    name: string;
    email: string;
    role: "USER" | "ADMIN";
    hashedPassword?: string;
  } = {
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
  };

  if (parsed.data.password) {
    data.hashedPassword = await bcrypt.hash(parsed.data.password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return jsonSuccess(user);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdmin();

  if (response) {
    return response;
  }

  const { id } = await params;

  if (session?.user?.id === id) {
    return jsonError("Cannot delete the current user.");
  }

  const existing = await prisma.user.findUnique({ where: { id } });

  if (!existing) {
    return jsonError("User not found.", 404);
  }

  const [orders, favorites] = await Promise.all([
    prisma.order.count({ where: { userId: id } }),
    prisma.favorite.count({ where: { userId: id } }),
  ]);

  if (orders > 0 || favorites > 0) {
    return jsonError("User has orders or favorites and cannot be deleted.");
  }

  await prisma.user.delete({ where: { id } });

  return jsonSuccess({ deleted: true });
}
