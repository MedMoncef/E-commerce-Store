import type { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search")?.trim() || undefined;
  const brand = searchParams.get("brand")?.trim() || undefined;
  const category = searchParams.get("category")?.trim() || undefined;
  const size = searchParams.get("size")?.trim() || undefined;
  const color = searchParams.get("color")?.trim() || undefined;
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort")?.trim() || "newest";
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "12");

  if (Number.isNaN(page) || Number.isNaN(limit)) {
    return jsonError("Invalid pagination values.");
  }

  const where: Prisma.ProductWhereInput = { isActive: true };

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  if (brand) {
    where.brand = { is: { slug: brand } };
  }

  if (category) {
    where.category = { is: { slug: category } };
  }

  if (size) {
    where.sizes = { array_contains: [size] };
  }

  if (color) {
    where.colors = { array_contains: [color] };
  }

  if (minPrice || maxPrice) {
    where.price = {
      gte: minPrice ? Number(minPrice) : undefined,
      lte: maxPrice ? Number(maxPrice) : undefined,
    };
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };

  if (sort === "price_asc") {
    orderBy = { price: "asc" };
  }

  if (sort === "price_desc") {
    orderBy = { price: "desc" };
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / limit));

  return jsonSuccess({ products, total, pages });
}
