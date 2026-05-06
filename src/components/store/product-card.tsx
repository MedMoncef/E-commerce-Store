import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { toStringArray } from "@/lib/data-utils";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number | null;
    images: unknown;
    brand?: { name: string; slug: string } | null;
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const images = toStringArray(product.images);
  const image = images[0] ?? "https://placehold.co/600x800/png?text=Product";

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-4/5 overflow-hidden rounded-xl bg-muted/40">
        <Image
          src={image}
          alt={product.name}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {product.name}
          </h3>
          {product.brand && (
            <Badge variant="secondary">{product.brand.name}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {formatCurrency(product.price)}
          </span>
          {product.compareAtPrice ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatCurrency(product.compareAtPrice)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
