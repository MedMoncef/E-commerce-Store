"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import Image from "next/image";

const STATUS_ACTIONS: Record<
  string,
  Array<{ label: string; status: string; variant?: "default" | "outline" | "destructive" }>
> = {
  PENDING: [
    { label: "Confirm", status: "CONFIRMED" },
    { label: "Cancel", status: "CANCELLED", variant: "destructive" },
  ],
  CONFIRMED: [
    { label: "Ship", status: "SHIPPED" },
    { label: "Cancel", status: "CANCELLED", variant: "destructive" },
  ],
  SHIPPED: [
    { label: "Deliver", status: "DELIVERED" },
    { label: "Cancel", status: "CANCELLED", variant: "destructive" },
  ],
  DELIVERED: [
    { label: "Cancel", status: "CANCELLED", variant: "destructive" },
  ],
  CANCELLED: [{ label: "Reopen", status: "PENDING", variant: "outline" }],
};

type ShippingAddress = {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
};

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
  product: {
    id: string;
    name: string;
    featuredImage?: { url: string } | null;
    images: Array<{ url: string }>;
  };
};

type Order = {
  id: string;
  email: string | null;
  status: string;
  total: number;
  createdAt: string;
  user: { name: string | null; email: string | null } | null;
  shippingAddress?: ShippingAddress | null;
  items: OrderItem[];
};

type AdminOrdersClientProps = {
  orders: Order[];
};

export function AdminOrdersClient({ orders }: AdminOrdersClientProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;
      if (!matchesStatus) {
        return false;
      }
      if (!term) {
        return true;
      }
      const details = [
        order.id,
        order.email,
        order.user?.email,
        order.user?.name,
        order.shippingAddress?.name,
        ...order.items.map((item) => item.product.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return details.includes(term);
    });
  }, [orders, search, statusFilter]);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    setError(null);

    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const result = (await response.json()) as { success: boolean; error?: string };

    if (!response.ok || !result.success) {
      setError(result.error || "Unable to update order.");
    } else {
      window.location.reload();
    }

    setUpdating(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Orders
        </p>
        <h1 className="heading-font text-3xl font-semibold">Orders</h1>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-55">
            <Label
              htmlFor="order-search"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Search
            </Label>
            <Input
              id="order-search"
              type="search"
              placeholder="Search orders"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="shrink-0 min-w-50">
            <Label
              htmlFor="order-status"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Status
            </Label>
            <select
              id="order-status"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            {filteredOrders.length} result{filteredOrders.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No orders match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>
                    {order.user?.email || order.email || "Guest"}
                  </TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Order #{order.id}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="rounded-xl border border-border p-3">
                                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                  Customer
                                </p>
                                <p className="mt-2 text-sm font-semibold">
                                  {order.shippingAddress?.name ||
                                    order.user?.name ||
                                    "Guest"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {order.shippingAddress?.email ||
                                    order.user?.email ||
                                    order.email ||
                                    "No email"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {order.shippingAddress?.phone || "No phone"}
                                </p>
                              </div>
                              <div className="rounded-xl border border-border p-3">
                                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                  Shipping
                                </p>
                                <p className="mt-2 text-sm font-semibold">
                                  {order.shippingAddress?.address || "No address"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {[
                                    order.shippingAddress?.city,
                                    order.shippingAddress?.postalCode,
                                  ]
                                    .filter(Boolean)
                                    .join(", ") || "-"}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {order.items.map((item) => {
                                const image =
                                  item.product.featuredImage?.url ||
                                  item.product.images[0]?.url ||
                                  "https://placehold.co/600x800/png?text=Product";
                                const detailParts = [
                                  item.size ? `Size ${item.size}` : null,
                                  item.color ? `Color ${item.color}` : null,
                                ].filter(Boolean);
                                return (
                                  <div key={item.id} className="flex items-center gap-3">
                                    <div className="relative h-12 w-10 overflow-hidden rounded-lg">
                                      <Image
                                        src={image}
                                        alt={item.product.name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">
                                        {item.product.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Qty {item.quantity}
                                        {detailParts.length > 0
                                          ? ` • ${detailParts.join(" • ")}`
                                          : ""}
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
                        </DialogContent>
                      </Dialog>

                      {(STATUS_ACTIONS[order.status] || []).map((action) => (
                        <Button
                          key={action.status}
                          size="sm"
                          variant={action.variant || "default"}
                          disabled={updating === order.id}
                          onClick={() => updateStatus(order.id, action.status)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
