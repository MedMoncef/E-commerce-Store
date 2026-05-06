"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";

const checkoutSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  address: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().min(3),
  phone: z.string().min(5),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export default function CheckoutClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, totalPrice, clear } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
  });

  useEffect(() => {
    if (session?.user?.name) {
      setValue("name", session.user.name);
    }
    if (session?.user?.email) {
      setValue("email", session.user.email);
    }
  }, [session, setValue]);

  const onSubmit = async (values: CheckoutValues) => {
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      shipping: {
        name: values.name,
        address: values.address,
        city: values.city,
        postalCode: values.postalCode,
        phone: values.phone,
        email: values.email,
      },
      email: values.email,
    };

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as {
      success: boolean;
      data?: { id: string };
      error?: string;
    };

    if (!response.ok || !result.success) {
      setError(result.error || "Unable to place order.");
      setLoading(false);
      return;
    }

    clear();
    router.push(`/order-confirmation/${result.data?.id}`);
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-20 text-center">
        <h1 className="heading-font text-3xl font-semibold">Checkout</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your cart is empty. Add items before checking out.
        </p>
        <Button asChild className="mt-6">
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <h1 className="heading-font text-3xl font-semibold">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 rounded-2xl border border-border bg-card p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} />
            {errors.address && (
              <p className="text-xs text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} />
              {errors.city && (
                <p className="text-xs text-destructive">{errors.city.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal code</Label>
              <Input id="postalCode" {...register("postalCode")} />
              {errors.postalCode && (
                <p className="text-xs text-destructive">
                  {errors.postalCode.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" disabled={loading} type="submit">
            {loading ? "Placing order..." : "Place order"}
          </Button>
        </form>

        <div className="h-fit rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            {items.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty {item.quantity}
                  </p>
                </div>
                <p className="font-semibold">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
            <span>Total</span>
            <span className="text-lg font-semibold">
              {formatCurrency(totalPrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
