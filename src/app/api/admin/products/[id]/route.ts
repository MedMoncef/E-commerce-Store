import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";
import { productSchema } from "@/lib/validators";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid product payload.");
  }

  const existing = await prisma.product.findUnique({ where: { id } });

  if (!existing) {
    return jsonError("Product not found.", 404);
  }

  const {
    galleryImageIds = [],
    sizeIds = [],
    colorIds = [],
    featuredImageId,
  } = parsed.data;

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      seoTitle: parsed.data.seoTitle ?? null,
      seoDescription: parsed.data.seoDescription ?? null,
      seoKeywords: parsed.data.seoKeywords ?? null,
      price: parsed.data.price,
      compareAtPrice: parsed.data.compareAtPrice ?? null,
      stock: parsed.data.stock,
      brandId: parsed.data.brandId,
      categoryId: parsed.data.categoryId,
      isActive: parsed.data.isActive ?? true,
      featuredImageId: featuredImageId ?? null,
      sizes: { set: sizeIds.map((item) => ({ id: item })) },
      colors: { set: colorIds.map((item) => ({ id: item })) },
      images: {
        deleteMany: {},
        create: galleryImageIds.map((mediaId, index) => ({
          mediaId,
          sortOrder: index,
        })),
      },
    },
  });

  return jsonSuccess(product);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const { id } = await params;

  const existing = await prisma.product.findUnique({ where: { id } });

  if (!existing) {
    return jsonError("Product not found.", 404);
  }

  await prisma.product.delete({ where: { id } });

  return jsonSuccess({ deleted: true });
}
