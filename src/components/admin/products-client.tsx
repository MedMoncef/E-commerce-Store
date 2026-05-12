"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/format";
import { toStringArray } from "@/lib/data-utils";
import { slugify } from "@/lib/slug";

const formSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  price: z.coerce.number().nonnegative(),
  compareAtPrice: z.preprocess(
    (value) => (value === "" ? undefined : Number(value)),
    z.number().nonnegative().optional()
  ),
  images: z.string().min(2),
  sizes: z.string().min(1),
  colors: z.string().min(1),
  stock: z.coerce.number().int().nonnegative(),
  brandId: z.string().min(1),
  categoryId: z.string().min(1),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type AdminProductsClientProps = {
  products: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice: number | null;
    description: string;
    stock: number;
    isActive: boolean;
    images: unknown;
    sizes: unknown;
    colors: unknown;
    brand: { id: string; name: string } | null;
    category: { id: string; name: string } | null;
  }>;
  brands: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
};

export function AdminProductsClient({
  products,
  brands,
  categories,
}: AdminProductsClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<AdminProductsClientProps["products"][number] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      compareAtPrice: undefined,
      images: "",
      sizes: "",
      colors: "",
      stock: 0,
      brandId: "",
      categoryId: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (activeProduct) {
      form.reset({
        name: activeProduct.name,
        slug: activeProduct.slug,
        description: activeProduct.description,
        price: activeProduct.price,
        compareAtPrice: activeProduct.compareAtPrice ?? undefined,
        images: toStringArray(activeProduct.images).join(", "),
        sizes: toStringArray(activeProduct.sizes).join(", "),
        colors: toStringArray(activeProduct.colors).join(", "),
        stock: activeProduct.stock,
        brandId: activeProduct.brand?.id ?? "",
        categoryId: activeProduct.category?.id ?? "",
        isActive: activeProduct.isActive,
      });
    } else {
      form.reset({
        name: "",
        slug: "",
        description: "",
        price: 0,
        compareAtPrice: undefined,
        images: "",
        sizes: "",
        colors: "",
        stock: 0,
        brandId: "",
        categoryId: "",
        isActive: true,
      });
    }
  }, [activeProduct, form]);

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setError(null);

    const payload = {
      ...values,
      compareAtPrice: values.compareAtPrice,
      images: values.images.split(",").map((item) => item.trim()).filter(Boolean),
      sizes: values.sizes.split(",").map((item) => item.trim()).filter(Boolean),
      colors: values.colors.split(",").map((item) => item.trim()).filter(Boolean),
      isActive: values.isActive ?? true,
    };

    const response = await fetch(
      activeProduct ? `/api/admin/products/${activeProduct.id}` : "/api/admin/products",
      {
        method: activeProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const result = (await response.json()) as { success: boolean; error?: string };

    if (!response.ok || !result.success) {
      setError(result.error || "Unable to save product.");
      setSubmitting(false);
      return;
    }

    setOpen(false);
    setActiveProduct(null);
    setSubmitting(false);
    router.refresh();
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm("Delete this product?")) {
      return;
    }

    await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Products
          </p>
          <h1 className="heading-font text-3xl font-semibold">Products</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setActiveProduct(null)}>Add product</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {activeProduct ? "Edit product" : "Add product"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input {...form.register("name")} />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <div className="flex items-center gap-2">
                    <Input className="flex-1" {...form.register("slug")} />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-11"
                      onClick={() =>
                        form.setValue(
                          "slug",
                          slugify(form.getValues("name"))
                        )
                      }
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea {...form.register("description")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input type="number" step="0.01" {...form.register("price")} />
                </div>
                <div className="space-y-2">
                  <Label>Compare at price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("compareAtPrice")}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input type="number" {...form.register("stock")} />
                </div>
                <div className="space-y-2">
                  <Label>Active</Label>
                  <div className="flex h-11 items-center gap-2 rounded-xl border border-border px-3">
                    <Controller
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <Checkbox
                          checked={Boolean(field.value)}
                          onCheckedChange={(checked) =>
                            field.onChange(checked === true)
                          }
                        />
                      )}
                    />
                    <span className="text-sm text-muted-foreground">
                      Show in storefront
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <select
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                    {...form.register("brandId")}
                  >
                    <option value="">Select brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                    {...form.register("categoryId")}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Images (comma separated URLs)</Label>
                <Input {...form.register("images")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Sizes (comma separated)</Label>
                  <Input {...form.register("sizes")} />
                </div>
                <div className="space-y-2">
                  <Label>Colors (comma separated)</Label>
                  <Input {...form.register("colors")} />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save product"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.brand?.name || "-"}</TableCell>
                <TableCell>{product.category?.name || "-"}</TableCell>
                <TableCell>{formatCurrency(product.price)}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  {product.isActive ? "Active" : "Hidden"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveProduct(product);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      Delete
                    </Button>
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
