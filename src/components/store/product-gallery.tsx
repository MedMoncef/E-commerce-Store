"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

const FALLBACK_IMAGE = "https://placehold.co/900x1200/png?text=Product";

type ProductGalleryProps = {
  featuredImage?: string | null;
  galleryImages: string[];
  alt: string;
};

export function ProductGallery({
  featuredImage,
  galleryImages,
  alt,
}: ProductGalleryProps) {
  const images = useMemo(() => {
    const items: string[] = [];
    if (featuredImage) {
      items.push(featuredImage);
    }
    for (const image of galleryImages) {
      if (!items.includes(image)) {
        items.push(image);
      }
    }
    if (items.length === 0) {
      items.push(FALLBACK_IMAGE);
    }
    return items;
  }, [featuredImage, galleryImages]);

  const [active, setActive] = useState(images[0]);

  useEffect(() => {
    if (!images.includes(active)) {
      setActive(images[0]);
    }
  }, [active, images]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-4/5 overflow-hidden rounded-3xl border border-border bg-muted/30">
        <Image src={active} alt={alt} fill className="object-cover" />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((image) => {
            const isActive = image === active;
            return (
              <button
                key={image}
                type="button"
                className={`relative aspect-square overflow-hidden rounded-2xl border transition ${
                  isActive ? "border-primary" : "border-border"
                }`}
                onClick={() => setActive(image)}
              >
                <Image src={image} alt={alt} fill className="object-cover" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
