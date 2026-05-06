import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";
import { adminUserCreateSchema } from "@/lib/validators";

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return jsonSuccess(users);
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const body = await request.json().catch(() => null);
  const parsed = adminUserCreateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid user payload.");
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return jsonError("Email is already in use.");
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      hashedPassword,
      role: parsed.data.role ?? "USER",
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return jsonSuccess(user, { status: 201 });
}
