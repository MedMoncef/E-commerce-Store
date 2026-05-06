"use client";

import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";

export default function CartClient() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-20 text-center">
        <h1 className="heading-font text-3xl font-semibold">Your cart</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your cart is empty. Explore the collection to add new favorites.
        </p>
        <Button asChild className="mt-6">
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <h1 className="heading-font text-3xl font-semibold">Your cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {items.map((item) => (
            <div
              key={item.key}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row"
            >
              <div className="relative h-28 w-24 overflow-hidden rounded-xl bg-muted/40">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.size ? `Size: ${item.size}` : ""}{" "}
                      {item.color ? `• ${item.color}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1">
                    <button
                      className="text-sm"
                      onClick={() => updateQuantity(item.key, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span className="text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      className="text-sm"
                      onClick={() => updateQuantity(item.key, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.key)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{formatCurrency(totalPrice)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-semibold">Calculated at checkout</span>
          </div>
          <Button asChild className="mt-6 w-full">
            <Link href="/checkout">Proceed to checkout</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
