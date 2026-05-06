import { prisma } from "@/lib/prisma";
import { jsonSuccess, requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  return jsonSuccess(messages);
}
