import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AddToCartForm } from "@/components/store/add-to-cart-form";
import { ProductGallery } from "@/components/store/product-gallery";
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
  const title = product?.seoTitle || product?.name || "Product";
  const description = product?.seoDescription
    ? product.seoDescription
    : product
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
  const imageList = [
    ...(featuredImage ? [featuredImage] : []),
    ...galleryImages,
  ];
  const cartImages = Array.from(new Set(imageList));
  const fallbackImage = "https://placehold.co/900x1200/png?text=Product";
  const finalCartImages = cartImages.length > 0 ? cartImages : [fallbackImage];

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
        <ProductGallery
          featuredImage={featuredImage}
          galleryImages={galleryImages}
          alt={product.name}
        />

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
              images: finalCartImages,
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
