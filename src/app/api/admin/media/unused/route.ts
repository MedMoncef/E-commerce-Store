import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const hoursParam = request.nextUrl.searchParams.get("hours");
  const daysParam = request.nextUrl.searchParams.get("days");
  const includeParam = request.nextUrl.searchParams.get("include");
  const limitParam = request.nextUrl.searchParams.get("limit");

  const envHours = Number(process.env.MEDIA_UNUSED_AGE_HOURS || "168");
  const parsedHours = hoursParam ? Number(hoursParam) : null;
  const parsedDays = daysParam ? Number(daysParam) : null;

  const hours = parsedHours !== null
    ? parsedHours
    : parsedDays !== null
      ? parsedDays * 24
      : envHours;

  const limit = limitParam ? Number(limitParam) : undefined;

  if (Number.isNaN(hours) || hours < 0) {
    return jsonError("Invalid hours value.");
  }

  if (limitParam && (Number.isNaN(limit) || limit < 1)) {
    return jsonError("Invalid limit value.");
  }

  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  const where = {
    createdAt: { lte: cutoff },
    productImages: { none: {} },
    featuredFor: { none: {} },
    brandImages: { none: {} },
    categoryImages: { none: {} },
  };

  const count = await prisma.media.count({ where });

  if (includeParam === "1") {
    const items = await prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        url: true,
        originalName: true,
        size: true,
        createdAt: true,
      },
    });

    return jsonSuccess({ count, items });
  }

  return jsonSuccess({ count });
}
