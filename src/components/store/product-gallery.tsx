"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

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
  const stripRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (!images.includes(active)) {
      setActive(images[0]);
    }
  }, [active, images]);

  useEffect(() => {
    const node = stripRef.current;
    if (!node) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const maxScrollLeft = node.scrollWidth - node.clientWidth;
    setCanScrollLeft(node.scrollLeft > 0);
    setCanScrollRight(node.scrollLeft < maxScrollLeft - 1);
  }, [images]);

  const updateScrollState = () => {
    const node = stripRef.current;
    if (!node) {
      return;
    }
    const maxScrollLeft = node.scrollWidth - node.clientWidth;
    setCanScrollLeft(node.scrollLeft > 0);
    setCanScrollRight(node.scrollLeft < maxScrollLeft - 1);
  };

  const scrollThumbnails = (direction: "left" | "right") => {
    const node = stripRef.current;
    if (!node) {
      return;
    }
    const distance = Math.max(200, Math.floor(node.clientWidth * 0.8));
    node.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    const node = stripRef.current;
    if (!node) {
      return;
    }
    node.setPointerCapture(event.pointerId);
    dragState.current = {
      isDragging: true,
      startX: event.clientX,
      scrollLeft: node.scrollLeft,
      moved: false,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = dragState.current;
    if (!state.isDragging) {
      return;
    }
    const node = stripRef.current;
    if (!node) {
      return;
    }
    const delta = event.clientX - state.startX;
    if (Math.abs(delta) > 4) {
      state.moved = true;
    }
    node.scrollLeft = state.scrollLeft - delta;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = stripRef.current;
    if (!dragState.current.isDragging) {
      return;
    }
    dragState.current.isDragging = false;
    if (node?.hasPointerCapture(event.pointerId)) {
      node.releasePointerCapture(event.pointerId);
    }
    if (dragState.current.moved) {
      window.setTimeout(() => {
        dragState.current.moved = false;
      }, 0);
    }
  };

  const handleThumbnailClick = (image: string) => {
    if (dragState.current.moved) {
      dragState.current.moved = false;
      return;
    }
    setActive(image);
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-4/5 overflow-hidden rounded-3xl border border-border bg-muted/30">
        <Image src={active} alt={alt} fill className="object-cover" />
      </div>
      {images.length > 1 && (
        <div className="relative">
          <div
            ref={stripRef}
            className="flex cursor-grab gap-3 overflow-x-auto pb-2 select-none active:cursor-grabbing"
            onScroll={updateScrollState}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {images.map((image) => {
              const isActive = image === active;
              return (
                <button
                  key={image}
                  type="button"
                  className={`relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-2xl border transition sm:h-24 sm:w-24 ${
                    isActive ? "border-primary" : "border-border"
                  }`}
                  onClick={() => handleThumbnailClick(image)}
                >
                  <Image src={image} alt={alt} fill className="object-cover" />
                </button>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="pointer-events-auto -ml-4"
              disabled={!canScrollLeft}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => scrollThumbnails("left")}
              aria-label="Scroll thumbnails left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="pointer-events-auto -mr-4"
              disabled={!canScrollRight}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => scrollThumbnails("right")}
              aria-label="Scroll thumbnails right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
