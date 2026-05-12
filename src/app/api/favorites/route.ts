import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireUser } from "@/lib/api-helpers";
import { favoriteSchema } from "@/lib/validators";

export async function GET() {
  const { response, session } = await requireUser();

  if (response) {
    return response;
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          featuredImage: { select: { url: true } },
          images: {
            orderBy: { sortOrder: "asc" },
            select: { media: { select: { url: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = favorites.map((favorite) => ({
    ...favorite,
    product: {
      ...favorite.product,
      images: favorite.product.images.map((image) => image.media),
    },
  }));

  return jsonSuccess(formatted);
}

export async function POST(request: Request) {
  const { response, session } = await requireUser();

  if (response) {
    return response;
  }

  const body = await request.json().catch(() => null);
  const parsed = favoriteSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid favorite payload.");
  }

  const favorite = await prisma.favorite.upsert({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId: parsed.data.productId,
      },
    },
    update: {},
    create: {
      userId: session.user.id,
      productId: parsed.data.productId,
    },
  });

  return jsonSuccess(favorite);
}

export async function DELETE(request: NextRequest) {
  const { response, session } = await requireUser();

  if (response) {
    return response;
  }

  const productId = request.nextUrl.searchParams.get("productId");

  if (!productId) {
    return jsonError("Product id is required.");
  }

  await prisma.favorite.deleteMany({
    where: {
      userId: session.user.id,
      productId,
    },
  });

  return jsonSuccess({ removed: true });
}
