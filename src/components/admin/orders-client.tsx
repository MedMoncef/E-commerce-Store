"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
  SHIPPED: [{ label: "Deliver", status: "DELIVERED" }],
  DELIVERED: [],
  CANCELLED: [],
};

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
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
  items: OrderItem[];
};

type AdminOrdersClientProps = {
  orders: Order[];
};

export function AdminOrdersClient({ orders }: AdminOrdersClientProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
            {orders.map((order) => (
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
                        <div className="space-y-3">
                          {order.items.map((item) => {
                            const image =
                              item.product.featuredImage?.url ||
                              item.product.images[0]?.url ||
                              "https://placehold.co/600x800/png?text=Product";
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
                                  </p>
                                </div>
                                <p className="text-sm font-semibold">
                                  {formatCurrency(item.price * item.quantity)}
                                </p>
                              </div>
                            );
                          })}
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
