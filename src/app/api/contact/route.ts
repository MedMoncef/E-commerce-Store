import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-helpers";
import { contactSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid contact submission.");
  }

  const message = await prisma.contactMessage.create({
    data: parsed.data,
  });

  return jsonSuccess({ id: message.id });
}
