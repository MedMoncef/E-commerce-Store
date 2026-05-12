import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";
import { categorySchema } from "@/lib/validators";

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return jsonSuccess(categories);
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const body = await request.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid category payload.");
  }

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      imageId: parsed.data.imageId ?? null,
    },
  });

  return jsonSuccess(category, { status: 201 });
}
