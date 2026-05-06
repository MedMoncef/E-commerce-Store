import Link from "next/link";
import Image from "next/image";

import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { getBrands, getCategories, getFeaturedProducts } from "@/lib/store";
import { SITE_DESCRIPTION } from "@/lib/constants";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Home",
  description: SITE_DESCRIPTION,
  path: "/",
});

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, brands, categories] = await Promise.all([
    getFeaturedProducts(8),
    getBrands(),
    getCategories(),
  ]);

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ffe9dc,transparent_60%)]" />
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-12 translate-x-20 rounded-full bg-secondary/20 blur-3xl" />
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 md:grid-cols-2">
          <div className="relative z-10 flex flex-col gap-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              New season drop
            </p>
            <h1 className="heading-font text-4xl font-semibold leading-tight md:text-5xl">
              Everyday essentials, elevated for the city cadence.
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              {SITE_DESCRIPTION} Discover fresh silhouettes, warm textures, and
              versatile layers built for movement.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/products">Shop the collection</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/about">Our story</Link>
              </Button>
            </div>
          </div>
          <div className="relative z-10">
            <div className="relative aspect-4/5 overflow-hidden rounded-4xl border border-border bg-muted/40 shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80"
                alt="Model wearing modern apparel"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Featured
            </p>
            <h2 className="heading-font text-3xl font-semibold">
              Fresh arrivals
            </h2>
          </div>
          <Link href="/products" className="text-sm font-semibold">
            View all
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-8">
            <h3 className="heading-font text-2xl font-semibold">Shop by brand</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Curated labels with a focus on durability and effortless styling.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {brands.slice(0, 6).map((brand) => (
                <Link
                  key={brand.id}
                  href={`/products?brand=${brand.slug}`}
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/40"
                >
                  {brand.name}
                </Link>
              ))}
              {brands.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Add brands from the admin dashboard to highlight them here.
                </p>
              )}
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-secondary p-8 text-secondary-foreground">
            <h3 className="heading-font text-2xl font-semibold">
              Browse by category
            </h3>
            <p className="mt-2 text-sm text-secondary-foreground/70">
              Discover seasonal staples across apparel, footwear, and accessories.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="rounded-full border border-secondary-foreground/30 px-4 py-2 text-sm font-medium transition hover:bg-secondary-foreground/10"
                >
                  {category.name}
                </Link>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-secondary-foreground/70">
                  Add categories from the admin dashboard to spotlight them here.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
