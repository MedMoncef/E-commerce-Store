"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/components/providers/cart-provider";
import { formatCurrency } from "@/lib/format";

type AddToCartFormProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    sizes: string[];
    colors: string[];
    stock: number;
  };
};

export function AddToCartForm({ product }: AddToCartFormProps) {
  const { addItem } = useCart();
  const [size, setSize] = useState<string | undefined>();
  const [color, setColor] = useState<string | undefined>();
  const [message, setMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canOrder = product.stock > 0;

  useEffect(() => {
    return () => {
      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
      }
    };
  }, []);

  const showToast = (text: string) => {
    setToast(text);
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    toastTimeout.current = setTimeout(() => {
      setToast(null);
    }, 2200);
  };

  const handleAdd = () => {
    setMessage(null);

    if (product.sizes.length > 0 && !size) {
      setMessage("Select a size to continue.");
      return;
    }

    if (product.colors.length > 0 && !color) {
      setMessage("Select a color to continue.");
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images[0] || "https://placehold.co/600x800/png?text=Product",
      quantity: 1,
      size,
      color,
    });

    setMessage(null);
    showToast("Added to cart.");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Price
          </p>
          <p className="text-lg font-semibold text-foreground">
            {formatCurrency(product.price)}
          </p>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {canOrder ? `${product.stock} in stock` : "Out of stock"}
        </p>
      </div>

      {product.sizes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Size</p>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a size" />
            </SelectTrigger>
            <SelectContent>
              {product.sizes.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {product.colors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Color</p>
          <Select value={color} onValueChange={setColor}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a color" />
            </SelectTrigger>
            <SelectContent>
              {product.colors.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}

      <Button className="w-full" onClick={handleAdd} disabled={!canOrder}>
        Add to cart
      </Button>

      {toast ? (
        <div
          className="fixed bottom-6 right-6 z-50 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-lg"
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
