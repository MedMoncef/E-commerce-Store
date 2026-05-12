import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AddToCartForm } from "@/components/store/add-to-cart-form";
import { FavoriteButton } from "@/components/store/favorite-button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { getProductBySlug } from "@/lib/store";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const title = product?.name || "Product";
  const description = product
    ? product.description.slice(0, 160)
    : "Product details and pricing.";

  return buildMetadata({
    title,
    description,
    path: `/product/${slug}`,
  });
}

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const galleryImages = product.images.map((image) => image.url);
  const sizes = product.sizes.map((size) => size.name);
  const colors = product.colors.map((color) => color.name);
  const featuredImage = product.featuredImage?.url ?? null;

  const mainImage =
    featuredImage ||
    galleryImages[0] ||
    "https://placehold.co/900x1200/png?text=Product";
  const cartImages = [
    mainImage,
    ...galleryImages.filter((image) => image !== mainImage),
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-foreground">
          Shop
        </Link>
        <span>/</span>
        {product.category ? (
          <Link
            href={`/category/${product.category.slug}`}
            className="hover:text-foreground"
          >
            {product.category.name}
          </Link>
        ) : (
          <span>Product</span>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="relative aspect-4/5 overflow-hidden rounded-3xl border border-border bg-muted/30">
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          {galleryImages.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {galleryImages.slice(0, 3).map((image) => (
                <div
                  key={image}
                  className="relative aspect-square overflow-hidden rounded-2xl border border-border"
                >
                  <Image src={image} alt={product.name} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {product.brand && (
                <Badge variant="secondary">{product.brand.name}</Badge>
              )}
              {product.stock > 0 ? (
                <Badge variant="outline">In stock</Badge>
              ) : (
                <Badge variant="outline">Out of stock</Badge>
              )}
            </div>
            <h1 className="heading-font text-3xl font-semibold">
              {product.name}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(product.price)}
              </span>
              {product.compareAtPrice ? (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              ) : null}
            </div>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <AddToCartForm
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              images: cartImages,
              sizes,
              colors,
              stock: product.stock,
            }}
          />
          <FavoriteButton productId={product.id} />
        </div>
      </div>
    </div>
  );
}
