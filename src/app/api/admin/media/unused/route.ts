import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const daysParam = request.nextUrl.searchParams.get("days") || "7";
  const includeParam = request.nextUrl.searchParams.get("include");
  const limitParam = request.nextUrl.searchParams.get("limit");

  const days = Number(daysParam);
  const limit = limitParam ? Number(limitParam) : undefined;

  if (Number.isNaN(days) || days < 0) {
    return jsonError("Invalid days value.");
  }

  if (limitParam && (Number.isNaN(limit) || limit < 1)) {
    return jsonError("Invalid limit value.");
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

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
