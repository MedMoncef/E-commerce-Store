import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireUser } from "@/lib/api-helpers";
import { profileUpdateSchema } from "@/lib/validators";
import { toStringArray } from "@/lib/data-utils";

function mergeHistory(current: string[], value?: string) {
  if (!value) {
    return current;
  }
  if (current.includes(value)) {
    return current;
  }
  return [...current, value];
}

export async function GET() {
  const { response, session } = await requireUser();

  if (response) {
    return response;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      postalCode: true,
      country: true,
      previousNames: true,
      previousEmails: true,
    },
  });

  if (!user) {
    return jsonError("User not found.", 404);
  }

  return jsonSuccess({
    ...user,
    previousNames: toStringArray(user.previousNames),
    previousEmails: toStringArray(user.previousEmails),
  });
}

export async function PUT(request: Request) {
  const { response, session } = await requireUser();

  if (response) {
    return response;
  }

  const body = await request.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid profile data.");
  }

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!existing) {
    return jsonError("User not found.", 404);
  }

  if (parsed.data.email && parsed.data.email !== existing.email) {
    const emailInUse = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (emailInUse) {
      return jsonError("Email is already in use.");
    }
  }

  const previousNames = toStringArray(existing.previousNames);
  const previousEmails = toStringArray(existing.previousEmails);

  const updateData: {
    name?: string;
    email?: string;
    phone?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    postalCode?: string | null;
    country?: string | null;
    previousNames?: string[];
    previousEmails?: string[];
  } = {};

  if (parsed.data.name && parsed.data.name !== existing.name) {
    updateData.previousNames = mergeHistory(previousNames, existing.name);
    updateData.name = parsed.data.name;
  }

  if (parsed.data.email && parsed.data.email !== existing.email) {
    updateData.previousEmails = mergeHistory(previousEmails, existing.email);
    updateData.email = parsed.data.email;
  }

  if (parsed.data.phone !== undefined) {
    updateData.phone = parsed.data.phone ?? null;
  }

  if (parsed.data.addressLine1 !== undefined) {
    updateData.addressLine1 = parsed.data.addressLine1 ?? null;
  }

  if (parsed.data.addressLine2 !== undefined) {
    updateData.addressLine2 = parsed.data.addressLine2 ?? null;
  }

  if (parsed.data.city !== undefined) {
    updateData.city = parsed.data.city ?? null;
  }

  if (parsed.data.postalCode !== undefined) {
    updateData.postalCode = parsed.data.postalCode ?? null;
  }

  if (parsed.data.country !== undefined) {
    updateData.country = parsed.data.country ?? null;
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      postalCode: true,
      country: true,
      previousNames: true,
      previousEmails: true,
    },
  });

  return jsonSuccess({
    ...user,
    previousNames: toStringArray(user.previousNames),
    previousEmails: toStringArray(user.previousEmails),
  });
}
