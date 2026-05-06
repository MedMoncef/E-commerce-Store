import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";
import { brandSchema } from "@/lib/validators";

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
  });

  return jsonSuccess(brands);
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const body = await request.json().catch(() => null);
  const parsed = brandSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid brand payload.");
  }

  const brand = await prisma.brand.create({
    data: parsed.data,
  });

  return jsonSuccess(brand, { status: 201 });
}
