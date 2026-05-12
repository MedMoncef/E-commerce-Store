import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";
import { productSchema } from "@/lib/validators";

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      brand: { select: { id: true, name: true, slug: true } },
      category: { select: { id: true, name: true, slug: true } },
      featuredImage: { select: { id: true, url: true, originalName: true } },
      images: {
        orderBy: { sortOrder: "asc" },
        select: { media: { select: { id: true, url: true, originalName: true } } },
      },
    },
  });

  const formatted = products.map((product) => ({
    ...product,
    images: product.images.map((item) => item.media),
  }));

  return jsonSuccess(formatted);
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid product payload.");
  }

  const {
    galleryImageIds = [],
    sizeIds = [],
    colorIds = [],
    featuredImageId,
  } = parsed.data;

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      price: parsed.data.price,
      compareAtPrice: parsed.data.compareAtPrice ?? null,
      stock: parsed.data.stock,
      brandId: parsed.data.brandId,
      categoryId: parsed.data.categoryId,
      isActive: parsed.data.isActive ?? true,
      featuredImageId: featuredImageId ?? null,
      sizes: sizeIds.length ? { connect: sizeIds.map((id) => ({ id })) } : undefined,
      colors: colorIds.length ? { connect: colorIds.map((id) => ({ id })) } : undefined,
      images: galleryImageIds.length
        ? {
            create: galleryImageIds.map((mediaId, index) => ({
              mediaId,
              sortOrder: index,
            })),
          }
        : undefined,
    },
  });

  return jsonSuccess(product, { status: 201 });
}
