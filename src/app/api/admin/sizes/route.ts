import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";
import { sizeSchema } from "@/lib/validators";

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const sizes = await prisma.size.findMany({
    orderBy: { name: "asc" },
  });

  return jsonSuccess(sizes);
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const body = await request.json().catch(() => null);
  const parsed = sizeSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid size payload.");
  }

  const size = await prisma.size.create({
    data: parsed.data,
  });

  return jsonSuccess(size, { status: 201 });
}
