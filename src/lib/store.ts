import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type BrandSummary = {
  id: string;
  name: string;
  slug: string;
};

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
};

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: unknown;
  brand: BrandSummary | null;
  category: CategorySummary | null;
};

export type ProductDetail = ProductSummary & {
  description: string;
  sizes: unknown;
  colors: unknown;
  stock: number;
  isActive: boolean;
};

export type ProductFilters = {
  search?: string;
  brand?: string;
  category?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "newest";
  page?: number;
  limit?: number;
};

export async function getProductList(
  filters: ProductFilters
): Promise<{
  products: ProductSummary[];
  total: number;
  pages: number;
  page: number;
  limit: number;
}> {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 12;

  const where: Prisma.ProductWhereInput = { isActive: true };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }

  if (filters.brand) {
    where.brand = { is: { slug: filters.brand } };
  }

  if (filters.category) {
    where.category = { is: { slug: filters.category } };
  }

  if (filters.size) {
    where.sizes = { array_contains: [filters.size] };
  }

  if (filters.color) {
    where.colors = { array_contains: [filters.color] };
  }

  if (filters.minPrice || filters.maxPrice) {
    where.price = {
      gte: filters.minPrice,
      lte: filters.maxPrice,
    };
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };

  if (filters.sort === "price_asc") {
    orderBy = { price: "asc" };
  }

  if (filters.sort === "price_desc") {
    orderBy = { price: "desc" };
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        images: true,
        brand: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / limit));

  return { products, total, pages, page, limit };
}

export async function getFeaturedProducts(limit = 8): Promise<ProductSummary[]> {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      images: true,
      brand: { select: { id: true, name: true, slug: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  return prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      compareAtPrice: true,
      images: true,
      sizes: true,
      colors: true,
      stock: true,
      isActive: true,
      brand: { select: { id: true, name: true, slug: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function getBrands(): Promise<BrandSummary[]> {
  return prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export async function getCategories(): Promise<CategorySummary[]> {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}
