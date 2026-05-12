import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";
import { colorSchema } from "@/lib/validators";

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const colors = await prisma.color.findMany({
    orderBy: { name: "asc" },
  });

  return jsonSuccess(colors);
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const body = await request.json().catch(() => null);
  const parsed = colorSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid color payload.");
  }

  const color = await prisma.color.create({
    data: parsed.data,
  });

  return jsonSuccess(color, { status: 201 });
}
