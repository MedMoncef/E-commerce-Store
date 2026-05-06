import Link from "next/link";

import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { getBrands, getCategories, getProductList } from "@/lib/store";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Shop",
  description: "Browse all products and filter by brand, category, and price.",
  path: "/products",
});

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

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = getParam(params, "search")?.trim() || undefined;
  const brand = getParam(params, "brand") || undefined;
  const category = getParam(params, "category") || undefined;
  const size = getParam(params, "size") || undefined;
  const color = getParam(params, "color") || undefined;
  const sort = (getParam(params, "sort") as
    | "price_asc"
    | "price_desc"
    | "newest"
    | undefined) || "newest";
  const page = Number(getParam(params, "page") || "1");
  const limit = Number(getParam(params, "limit") || "12");
  const minPrice = getParam(params, "minPrice")
    ? Number(getParam(params, "minPrice"))
    : undefined;
  const maxPrice = getParam(params, "maxPrice")
    ? Number(getParam(params, "maxPrice"))
    : undefined;

  const [brands, categories, listing] = await Promise.all([
    getBrands(),
    getCategories(),
    getProductList({
      search,
      brand,
      category,
      size,
      color,
      sort,
      page,
      limit,
      minPrice,
      maxPrice,
    }),
  ]);

  const sizes = ["XS", "S", "M", "L", "XL"];
  const colors = ["Black", "White", "Navy", "Olive", "Sand", "Rust"];

  const buildQuery = (nextPage: number) => {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (brand) query.set("brand", brand);
    if (category) query.set("category", category);
    if (size) query.set("size", size);
    if (color) query.set("color", color);
    if (minPrice !== undefined) query.set("minPrice", String(minPrice));
    if (maxPrice !== undefined) query.set("maxPrice", String(maxPrice));
    if (sort) query.set("sort", sort);
    if (limit !== 12) query.set("limit", String(limit));
    query.set("page", String(nextPage));
    return query.toString();
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Shop
        </p>
        <h1 className="heading-font text-3xl font-semibold">All products</h1>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6 rounded-2xl border border-border bg-card p-6">
          <form className="space-y-4" method="GET">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Search
              </label>
              <input
                name="search"
                defaultValue={search}
                placeholder="Search products"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Category
              </label>
              <select
                name="category"
                defaultValue={category || ""}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="">All categories</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

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
                {sizes.map((option) => (
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
                {colors.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Min price
                </label>
                <input
                  name="minPrice"
                  defaultValue={minPrice ?? ""}
                  placeholder="0"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Max price
                </label>
                <input
                  name="maxPrice"
                  defaultValue={maxPrice ?? ""}
                  placeholder="500"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                />
              </div>
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
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {listing.total} products
            </p>
          </div>

          {listing.products.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No products matched your filters. Try adjusting your search.
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
                  href={`/products?${buildQuery(pageNumber)}`}
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
