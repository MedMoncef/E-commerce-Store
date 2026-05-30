"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
import { slugify } from "@/lib/slug";
import { MediaPicker } from "@/components/admin/media-picker";
import type { MediaItem } from "@/types/media";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const formSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  price: z.coerce.number().nonnegative(),
  compareAtPrice: z.preprocess(
    (value) => (value === "" ? undefined : Number(value)),
    z.number().nonnegative().optional()
  ),
  featuredImageId: z.string().optional().nullable(),
  galleryImageIds: z.array(z.string()).optional(),
  sizeIds: z.array(z.string()).optional(),
  colorIds: z.array(z.string()).optional(),
  stock: z.coerce.number().int().nonnegative(),
  brandId: z.string().min(1),
  categoryId: z.string().min(1),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type CatalogOption = { id: string; name: string; slug: string };

function mergeOptions(base: CatalogOption[], created: CatalogOption[]) {
  const map = new Map(base.map((item) => [item.id, item]));
  for (const item of created) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

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
    featuredImage: MediaItem | null;
    images: MediaItem[];
    sizes: CatalogOption[];
    colors: CatalogOption[];
    brand: { id: string; name: string } | null;
    category: { id: string; name: string } | null;
  }>;
  brands: CatalogOption[];
  categories: CatalogOption[];
  sizes: CatalogOption[];
  colors: CatalogOption[];
};

export function AdminProductsClient({
  products,
  brands,
  categories,
  sizes,
  colors,
}: AdminProductsClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<AdminProductsClientProps["products"][number] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featuredImage, setFeaturedImage] = useState<MediaItem | null>(null);
  const [galleryImages, setGalleryImages] = useState<MediaItem[]>([]);
  const [createdBrands, setCreatedBrands] = useState<CatalogOption[]>([]);
  const [createdCategories, setCreatedCategories] = useState<CatalogOption[]>([]);
  const [createdSizes, setCreatedSizes] = useState<CatalogOption[]>([]);
  const [createdColors, setCreatedColors] = useState<CatalogOption[]>([]);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSizeForm, setShowSizeForm] = useState(false);
  const [showColorForm, setShowColorForm] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSizeName, setNewSizeName] = useState("");
  const [newColorName, setNewColorName] = useState("");
  const [creatingBrand, setCreatingBrand] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingSize, setCreatingSize] = useState(false);
  const [creatingColor, setCreatingColor] = useState(false);
  const [pendingDeleteMediaIds, setPendingDeleteMediaIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("Delete image?");
  const [confirmDescription, setConfirmDescription] = useState("");
  const [confirmTargetIds, setConfirmTargetIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const brandOptions = useMemo(
    () => mergeOptions(brands, createdBrands),
    [brands, createdBrands]
  );
  const categoryOptions = useMemo(
    () => mergeOptions(categories, createdCategories),
    [categories, createdCategories]
  );
  const sizeOptions = useMemo(
    () => mergeOptions(sizes, createdSizes),
    [sizes, createdSizes]
  );
  const colorOptions = useMemo(
    () => mergeOptions(colors, createdColors),
    [colors, createdColors]
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" ? product.isActive : !product.isActive);
      if (!matchesStatus) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack = [
        product.name,
        product.slug,
        product.brand?.name ?? "",
        product.category?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [products, search, statusFilter]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      compareAtPrice: undefined,
      featuredImageId: null,
      galleryImageIds: [],
      sizeIds: [],
      colorIds: [],
      stock: 0,
      brandId: "",
      categoryId: "",
      isActive: true,
    },
  });

  const attemptDeleteMedia = async (imageId: string) => {
    const response = await fetch(`/api/admin/media/${imageId}`, {
      method: "DELETE",
    });
    const result = (await response.json()) as { success: boolean; error?: string };

    if (!response.ok || !result.success) {
      setError(result.error || "Unable to delete image.");
      return false;
    }

    return true;
  };

  const queueDeleteMedia = (imageId: string) => {
    setPendingDeleteMediaIds((prev) =>
      prev.includes(imageId) ? prev : [...prev, imageId]
    );
  };

  const unqueueDeleteMedia = (imageIds: string[]) => {
    if (imageIds.length === 0) {
      return;
    }
    setPendingDeleteMediaIds((prev) =>
      prev.filter((id) => !imageIds.includes(id))
    );
  };

  const requestDeleteMedia = (ids: string[], title: string, description: string) => {
    if (ids.length === 0) {
      return;
    }
    setConfirmTargetIds(ids);
    setConfirmTitle(title);
    setConfirmDescription(description);
    setConfirmOpen(true);
  };

  const handleConfirmDeleteMedia = () => {
    confirmTargetIds.forEach((id) => queueDeleteMedia(id));
    setConfirmTargetIds([]);
    setConfirmOpen(false);
  };

  useEffect(() => {
    if (activeProduct) {
      form.reset({
        name: activeProduct.name,
        slug: activeProduct.slug,
        description: activeProduct.description,
        price: activeProduct.price,
        compareAtPrice: activeProduct.compareAtPrice ?? undefined,
        featuredImageId: activeProduct.featuredImage?.id ?? null,
        galleryImageIds: activeProduct.images.map((image) => image.id),
        sizeIds: activeProduct.sizes.map((size) => size.id),
        colorIds: activeProduct.colors.map((color) => color.id),
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
        featuredImageId: null,
        galleryImageIds: [],
        sizeIds: [],
        colorIds: [],
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
      featuredImageId: values.featuredImageId ?? null,
      galleryImageIds: values.galleryImageIds ?? [],
      sizeIds: values.sizeIds ?? [],
      colorIds: values.colorIds ?? [],
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

    const pending = pendingDeleteMediaIds;
    setPendingDeleteMediaIds([]);

    if (pending.length > 0) {
      const failures: string[] = [];
      for (const imageId of pending) {
        const deleted = await attemptDeleteMedia(imageId);
        if (!deleted) {
          failures.push(imageId);
        }
      }
      if (failures.length > 0) {
        window.alert("Some images could not be deleted because they are still in use.");
      }
    }

    setOpen(false);
    setActiveProduct(null);
    setFeaturedImage(null);
    setGalleryImages([]);
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

  const handleRemoveGalleryImage = async (id: string) => {
    const nextImages = galleryImages.filter((image) => image.id !== id);
    setGalleryImages(nextImages);
    form.setValue(
      "galleryImageIds",
      nextImages.map((image) => image.id)
    );

    if (featuredImage?.id === id) {
      setError("This image is still set as featured.");
      return;
    }

    requestDeleteMedia(
      [id],
      "Delete image?",
      "Delete this image from the media library so it does not accumulate."
    );
  };

  const createBrand = async () => {
    const name = newBrandName.trim();
    if (!name) {
      setError("Brand name is required.");
      return;
    }

    setCreatingBrand(true);
    setError(null);

    const response = await fetch("/api/admin/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slugify(name) }),
    });

    const result = (await response.json()) as {
      success: boolean;
      data?: CatalogOption;
      error?: string;
    };

    if (!response.ok || !result.success || !result.data) {
      setError(result.error || "Unable to create brand.");
    } else {
      setCreatedBrands((prev) => [...prev, result.data!]);
      form.setValue("brandId", result.data!.id);
      setNewBrandName("");
      setShowBrandForm(false);
    }

    setCreatingBrand(false);
  };

  const createCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      setError("Category name is required.");
      return;
    }

    setCreatingCategory(true);
    setError(null);

    const response = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slugify(name) }),
    });

    const result = (await response.json()) as {
      success: boolean;
      data?: CatalogOption;
      error?: string;
    };

    if (!response.ok || !result.success || !result.data) {
      setError(result.error || "Unable to create category.");
    } else {
      setCreatedCategories((prev) => [...prev, result.data!]);
      form.setValue("categoryId", result.data!.id);
      setNewCategoryName("");
      setShowCategoryForm(false);
    }

    setCreatingCategory(false);
  };

  const createSize = async () => {
    const name = newSizeName.trim();
    if (!name) {
      setError("Size name is required.");
      return;
    }

    setCreatingSize(true);
    setError(null);

    const response = await fetch("/api/admin/sizes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slugify(name) }),
    });

    const result = (await response.json()) as {
      success: boolean;
      data?: CatalogOption;
      error?: string;
    };

    if (!response.ok || !result.success || !result.data) {
      setError(result.error || "Unable to create size.");
    } else {
      setCreatedSizes((prev) => [...prev, result.data!]);
      form.setValue("sizeIds", [
        ...(form.getValues("sizeIds") ?? []),
        result.data!.id,
      ]);
      setNewSizeName("");
      setShowSizeForm(false);
    }

    setCreatingSize(false);
  };

  const createColor = async () => {
    const name = newColorName.trim();
    if (!name) {
      setError("Color name is required.");
      return;
    }

    setCreatingColor(true);
    setError(null);

    const response = await fetch("/api/admin/colors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slugify(name) }),
    });

    const result = (await response.json()) as {
      success: boolean;
      data?: CatalogOption;
      error?: string;
    };

    if (!response.ok || !result.success || !result.data) {
      setError(result.error || "Unable to create color.");
    } else {
      setCreatedColors((prev) => [...prev, result.data!]);
      form.setValue("colorIds", [
        ...(form.getValues("colorIds") ?? []),
        result.data!.id,
      ]);
      setNewColorName("");
      setShowColorForm(false);
    }

    setCreatingColor(false);
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
        <Dialog
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen) {
              setActiveProduct(null);
              setError(null);
              setFeaturedImage(null);
              setGalleryImages([]);
              setPendingDeleteMediaIds([]);
              setShowBrandForm(false);
              setShowCategoryForm(false);
              setShowSizeForm(false);
              setShowColorForm(false);
              setNewBrandName("");
              setNewCategoryName("");
              setNewSizeName("");
              setNewColorName("");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setActiveProduct(null);
                setFeaturedImage(null);
                setGalleryImages([]);
                setPendingDeleteMediaIds([]);
                setError(null);
              }}
            >
              Add product
            </Button>
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
                  <div className="flex items-center justify-between">
                    <Label>Brand</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBrandForm((prev) => !prev)}
                    >
                      {showBrandForm ? "Close" : "+ Add"}
                    </Button>
                  </div>
                  <select
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                    {...form.register("brandId")}
                  >
                    <option value="">Select brand</option>
                    {brandOptions.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                  {showBrandForm && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Input
                        value={newBrandName}
                        onChange={(event) => setNewBrandName(event.target.value)}
                        placeholder="New brand name"
                      />
                      <Button
                        type="button"
                        onClick={createBrand}
                        disabled={creatingBrand}
                      >
                        {creatingBrand ? "Adding..." : "Add brand"}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Category</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCategoryForm((prev) => !prev)}
                    >
                      {showCategoryForm ? "Close" : "+ Add"}
                    </Button>
                  </div>
                  <select
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                    {...form.register("categoryId")}
                  >
                    <option value="">Select category</option>
                    {categoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {showCategoryForm && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Input
                        value={newCategoryName}
                        onChange={(event) => setNewCategoryName(event.target.value)}
                        placeholder="New category name"
                      />
                      <Button
                        type="button"
                        onClick={createCategory}
                        disabled={creatingCategory}
                      >
                        {creatingCategory ? "Adding..." : "Add category"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Featured image</Label>
                  <MediaPicker
                    title="Select featured image"
                    selectedIds={featuredImage ? [featuredImage.id] : []}
                    onSelect={async (items) => {
                      const image = items[0] ?? null;
                      if (featuredImage && image && featuredImage.id !== image.id) {
                        if (galleryImages.some((item) => item.id === featuredImage.id)) {
                          setError(
                            "Previous featured image is still in the gallery. Remove it there to delete."
                          );
                        } else {
                          requestDeleteMedia(
                            [featuredImage.id],
                            "Delete previous featured image?",
                            "Delete the previous featured image from the media library so it does not accumulate."
                          );
                        }
                      }
                      unqueueDeleteMedia(image?.id ? [image.id] : []);
                      setFeaturedImage(image);
                      form.setValue("featuredImageId", image?.id ?? null);
                    }}
                    trigger={
                      <Button type="button" variant="outline" size="sm">
                        {featuredImage ? "Change" : "Choose"}
                      </Button>
                    }
                  />
                </div>
                {featuredImage ? (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                      <Image
                        src={featuredImage.url}
                        alt={featuredImage.originalName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">
                        {featuredImage.originalName}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFeaturedImage(null);
                        form.setValue("featuredImageId", null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No image selected.</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Gallery images</Label>
                  <MediaPicker
                    title="Select gallery images"
                    multiple
                    selectedIds={galleryImages.map((image) => image.id)}
                    onSelect={async (items) => {
                      const removed = galleryImages.filter(
                        (image) => !items.some((next) => next.id === image.id)
                      );
                      const removable = removed.filter(
                        (image) => image.id !== featuredImage?.id
                      );

                      if (removable.length > 0) {
                        requestDeleteMedia(
                          removable.map((image) => image.id),
                          "Delete removed images?",
                          `Delete ${removable.length} removed image(s) from the media library so they do not accumulate.`
                        );
                      }

                      unqueueDeleteMedia(items.map((image) => image.id));
                      setGalleryImages(items);
                      form.setValue(
                        "galleryImageIds",
                        items.map((image) => image.id)
                      );
                    }}
                    trigger={
                      <Button type="button" variant="outline" size="sm">
                        {galleryImages.length > 0 ? "Edit" : "Choose"}
                      </Button>
                    }
                  />
                </div>
                {galleryImages.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {galleryImages.map((image) => (
                      <div
                        key={image.id}
                        className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3"
                      >
                        <div className="relative h-14 w-14 overflow-hidden rounded-lg">
                          <Image
                            src={image.url}
                            alt={image.originalName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium line-clamp-1">
                            {image.originalName}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveGalleryImage(image.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No gallery images selected.
                  </p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Sizes</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSizeForm((prev) => !prev)}
                    >
                      {showSizeForm ? "Close" : "+ Add"}
                    </Button>
                  </div>
                  <Controller
                    control={form.control}
                    name="sizeIds"
                    render={({ field }) => {
                      const values = field.value ?? [];
                      return (
                        <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-muted/20 p-3">
                          {sizeOptions.length === 0 ? (
                            <span className="text-xs text-muted-foreground">
                              No sizes yet.
                            </span>
                          ) : (
                            sizeOptions.map((size) => (
                              <label
                                key={size.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                <Checkbox
                                  checked={values.includes(size.id)}
                                  onCheckedChange={(checked) => {
                                    const next =
                                      checked === true
                                        ? [...values, size.id]
                                        : values.filter((item) => item !== size.id);
                                    field.onChange(next);
                                  }}
                                />
                                {size.name}
                              </label>
                            ))
                          )}
                        </div>
                      );
                    }}
                  />
                  {showSizeForm && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Input
                        value={newSizeName}
                        onChange={(event) => setNewSizeName(event.target.value)}
                        placeholder="New size name"
                      />
                      <Button
                        type="button"
                        onClick={createSize}
                        disabled={creatingSize}
                      >
                        {creatingSize ? "Adding..." : "Add size"}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Colors</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowColorForm((prev) => !prev)}
                    >
                      {showColorForm ? "Close" : "+ Add"}
                    </Button>
                  </div>
                  <Controller
                    control={form.control}
                    name="colorIds"
                    render={({ field }) => {
                      const values = field.value ?? [];
                      return (
                        <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-muted/20 p-3">
                          {colorOptions.length === 0 ? (
                            <span className="text-xs text-muted-foreground">
                              No colors yet.
                            </span>
                          ) : (
                            colorOptions.map((color) => (
                              <label
                                key={color.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                <Checkbox
                                  checked={values.includes(color.id)}
                                  onCheckedChange={(checked) => {
                                    const next =
                                      checked === true
                                        ? [...values, color.id]
                                        : values.filter((item) => item !== color.id);
                                    field.onChange(next);
                                  }}
                                />
                                {color.name}
                              </label>
                            ))
                          )}
                        </div>
                      );
                    }}
                  />
                  {showColorForm && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Input
                        value={newColorName}
                        onChange={(event) => setNewColorName(event.target.value)}
                        placeholder="New color name"
                      />
                      <Button
                        type="button"
                        onClick={createColor}
                        disabled={creatingColor}
                      >
                        {creatingColor ? "Adding..." : "Add color"}
                      </Button>
                    </div>
                  )}
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

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-55">
            <Label
              htmlFor="product-search"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Search
            </Label>
            <Input
              id="product-search"
              type="search"
              placeholder="Search products"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="min-w-45 shrink-0">
            <Label
              htmlFor="product-status"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Status
            </Label>
            <select
              id="product-status"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="HIDDEN">Hidden</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            {filteredProducts.length} result{filteredProducts.length === 1 ? "" : "s"}
          </p>
        </div>
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
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No products match your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
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
                          setFeaturedImage(product.featuredImage);
                          setGalleryImages(product.images);
                          setPendingDeleteMediaIds([]);
                          setError(null);
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel="Delete image"
        onConfirm={handleConfirmDeleteMedia}
        onOpenChange={(nextOpen) => {
          setConfirmOpen(nextOpen);
          if (!nextOpen) {
            setConfirmTargetIds([]);
          }
        }}
      />
    </div>
  );
}
