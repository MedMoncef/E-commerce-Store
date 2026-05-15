"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";

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
    featuredImage?: { url: string } | null;
    images: Array<{ url: string }>;
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
    featuredImage?: { url: string } | null;
    images: Array<{ url: string }>;
  };
};

type ProfileData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  previousNames: string[];
  previousEmails: string[];
};

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
};

export function AccountClient({ user }: AccountClientProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("ALL");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: user.name || "",
    email: user.email || "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

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

  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true);
      const response = await fetch("/api/account/profile");
      const result = (await response.json()) as {
        success: boolean;
        data?: ProfileData;
        error?: string;
      };

      if (response.ok && result.success && result.data) {
        setProfile(result.data);
        setProfileForm({
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone || "",
          addressLine1: result.data.addressLine1 || "",
          addressLine2: result.data.addressLine2 || "",
          city: result.data.city || "",
          postalCode: result.data.postalCode || "",
          country: result.data.country || "",
        });
      } else {
        setProfileError(result.error || "Unable to load profile.");
      }

      setProfileLoading(false);
    };

    fetchProfile();
  }, []);

  const handleProfileChange = (field: keyof ProfileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    if (profileSaved) {
      setProfileSaved(null);
    }
    if (profileError) {
      setProfileError(null);
    }
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileError(null);
    setProfileSaved(null);

    const response = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    });

    const result = (await response.json()) as {
      success: boolean;
      data?: ProfileData;
      error?: string;
    };

    if (!response.ok || !result.success || !result.data) {
      setProfileError(result.error || "Unable to update profile.");
      setProfileSaving(false);
      return;
    }

    setProfile(result.data);
    setProfileForm({
      name: result.data.name,
      email: result.data.email,
      phone: result.data.phone || "",
      addressLine1: result.data.addressLine1 || "",
      addressLine2: result.data.addressLine2 || "",
      city: result.data.city || "",
      postalCode: result.data.postalCode || "",
      country: result.data.country || "",
    });
    setProfileSaved("Profile updated.");
    setProfileSaving(false);
  };

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
                      const image =
                        item.product.featuredImage?.url ||
                        item.product.images[0]?.url ||
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
                  const image =
                    favorite.product.featuredImage?.url ||
                    favorite.product.images[0]?.url ||
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
          <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold">Profile</p>
              <Button
                size="sm"
                onClick={handleProfileSave}
                disabled={profileSaving}
              >
                {profileSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>

            {profileError && (
              <p className="text-sm text-destructive">{profileError}</p>
            )}
            {profileSaved && (
              <p className="text-sm text-emerald-600">{profileSaved}</p>
            )}

            {profileLoading ? (
              <p className="text-sm text-muted-foreground">Loading profile...</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={profileForm.name}
                    onChange={(event) =>
                      handleProfileChange("name", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(event) =>
                      handleProfileChange("email", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={profileForm.phone}
                    onChange={(event) =>
                      handleProfileChange("phone", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={profileForm.country}
                    onChange={(event) =>
                      handleProfileChange("country", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Address line 1</Label>
                  <Input
                    value={profileForm.addressLine1}
                    onChange={(event) =>
                      handleProfileChange("addressLine1", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Address line 2</Label>
                  <Input
                    value={profileForm.addressLine2}
                    onChange={(event) =>
                      handleProfileChange("addressLine2", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={profileForm.city}
                    onChange={(event) =>
                      handleProfileChange("city", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Postal code</Label>
                  <Input
                    value={profileForm.postalCode}
                    onChange={(event) =>
                      handleProfileChange("postalCode", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>
            )}

            {profile && (profile.previousNames.length > 0 || profile.previousEmails.length > 0) && (
              <div className="rounded-xl border border-dashed border-border p-4">
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-semibold"
                  onClick={() => setShowHistory((prev) => !prev)}
                >
                  Previous info
                  <ChevronDown
                    className={`h-4 w-4 transition ${showHistory ? "rotate-180" : ""}`}
                  />
                </button>
                {showHistory && (
                  <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                    {profile.previousNames.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em]">
                          Previous names
                        </p>
                        <ul className="mt-2 space-y-1">
                          {profile.previousNames.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {profile.previousEmails.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em]">
                          Previous emails
                        </p>
                        <ul className="mt-2 space-y-1">
                          {profile.previousEmails.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
