import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getBrands, getProductList } from "@/lib/store";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  const title = category?.name || "Category";
  const description = category
    ? `Shop ${category.name} at Northwind Outfitters.`
    : "Browse category products.";

  return buildMetadata({
    title,
    description,
    path: `/category/${slug}`,
  });
}

export const dynamic = "force-dynamic";

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });

  if (!category) {
    notFound();
  }

  const query = await searchParams;
  const brand = getParam(query, "brand") || undefined;
  const size = getParam(query, "size") || undefined;
  const color = getParam(query, "color") || undefined;
  const sort = (getParam(query, "sort") as
    | "price_asc"
    | "price_desc"
    | "newest"
    | undefined) || "newest";
  const page = Number(getParam(query, "page") || "1");

  const [brands, listing] = await Promise.all([
    getBrands(),
    getProductList({
      category: slug,
      brand,
      size,
      color,
      sort,
      page,
    }),
  ]);

  const buildQuery = (nextPage: number) => {
    const params = new URLSearchParams();
    if (brand) params.set("brand", brand);
    if (size) params.set("size", size);
    if (color) params.set("color", color);
    if (sort) params.set("sort", sort);
    params.set("page", String(nextPage));
    return params.toString();
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Category
        </p>
        <h1 className="heading-font text-3xl font-semibold">{category.name}</h1>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6 rounded-2xl border border-border bg-card p-6">
          <form className="space-y-4" method="GET">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Brand
              </label>
              <select
                name="brand"
                defaultValue={brand || ""}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="">All brands</option>
                {brands.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Size
              </label>
              <select
                name="size"
                defaultValue={size || ""}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="">All sizes</option>
                {[
                  "XS",
                  "S",
                  "M",
                  "L",
                  "XL",
                  "One size",
                ].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Color
              </label>
              <select
                name="color"
                defaultValue={color || ""}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="">All colors</option>
                {["Black", "White", "Navy", "Olive", "Sand", "Rust"].map(
                  (option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Sort
              </label>
              <select
                name="sort"
                defaultValue={sort}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
            </div>

            <Button className="w-full" type="submit">
              Apply filters
            </Button>
          </form>
        </aside>

        <section className="space-y-6">
          {listing.products.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No products in this category yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listing.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: listing.pages }, (_, index) => {
              const pageNumber = index + 1;
              const isActive = pageNumber === listing.page;
              return (
                <Link
                  key={pageNumber}
                  href={`/category/${slug}?${buildQuery(pageNumber)}`}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-foreground hover:bg-muted/40"
                  }`}
                >
                  {pageNumber}
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
