"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { toStringArray } from "@/lib/data-utils";

const STATUSES = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

type AccountClientProps = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  };
};

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images: unknown;
  };
};

type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
};

type Favorite = {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: unknown;
  };
};

export function AccountClient({ user }: AccountClientProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("ALL");

  const removeFavorite = async (productId: string) => {
    await fetch(`/api/favorites?productId=${productId}`, { method: "DELETE" });
    setFavorites((prev) => prev.filter((item) => item.product.id !== productId));
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true);
      const query = status === "ALL" ? "" : `?status=${status}`;
      const response = await fetch(`/api/orders${query}`);
      const result = (await response.json()) as {
        success: boolean;
        data?: Order[];
      };
      if (result.success && result.data) {
        setOrders(result.data);
      }
      setLoadingOrders(false);
    };

    fetchOrders();
  }, [status]);

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoadingFavorites(true);
      const response = await fetch("/api/favorites");
      const result = (await response.json()) as {
        success: boolean;
        data?: Favorite[];
      };
      if (result.success && result.data) {
        setFavorites(result.data);
      }
      setLoadingFavorites(false);
    };

    fetchFavorites();
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Account
        </p>
        <h1 className="heading-font text-3xl font-semibold">
          Welcome back{user.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <Tabs defaultValue="orders" className="mt-8">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <div className="mt-6 flex flex-wrap gap-2">
            {STATUSES.map((item) => (
              <Button
                key={item}
                variant={status === item ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus(item)}
              >
                {item === "ALL" ? "All" : item}
              </Button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {loadingOrders ? (
              <p className="text-sm text-muted-foreground">Loading orders...</p>
            ) : orders.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                No orders found for this filter.
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Order #{order.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{order.status}</Badge>
                      <span className="text-sm font-semibold">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {order.items.map((item) => {
                      const images = toStringArray(item.product.images);
                      const image =
                        images[0] ||
                        "https://placehold.co/600x800/png?text=Product";
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3"
                        >
                          <div className="relative h-14 w-12 overflow-hidden rounded-lg bg-muted/40">
                            <Image
                              src={image}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <Link
                              href={`/product/${item.product.slug}`}
                              className="text-sm font-medium"
                            >
                              {item.product.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              Qty {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-semibold">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="favorites">
          <div className="mt-6">
            {loadingFavorites ? (
              <p className="text-sm text-muted-foreground">Loading favorites...</p>
            ) : favorites.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                You have no favorites yet.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {favorites.map((favorite) => {
                  const images = toStringArray(favorite.product.images);
                  const image =
                    images[0] ||
                    "https://placehold.co/600x800/png?text=Product";
                  return (
                    <Link
                      key={favorite.id}
                      href={`/product/${favorite.product.slug}`}
                      className="group flex flex-col rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="relative aspect-4/5 overflow-hidden rounded-xl bg-muted/40">
                        <Image
                          src={image}
                          alt={favorite.product.name}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="mt-3 space-y-1">
                        <p className="text-sm font-semibold">
                          {favorite.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(favorite.product.price)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={(event) => {
                            event.preventDefault();
                            removeFavorite(favorite.product.id);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <p className="text-sm font-semibold">Profile</p>
            <p className="mt-2 text-sm text-muted-foreground">Name</p>
            <p className="text-sm font-medium">{user.name || ""}</p>
            <p className="mt-4 text-sm text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{user.email || ""}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
