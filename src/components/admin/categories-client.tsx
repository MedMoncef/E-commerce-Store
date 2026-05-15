"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { slugify } from "@/lib/slug";
import { MediaPicker } from "@/components/admin/media-picker";
import type { MediaItem } from "@/types/media";

const formSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  imageId: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type AdminCategoriesClientProps = {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    image: MediaItem | null;
  }>;
};

export function AdminCategoriesClient({
  categories,
}: AdminCategoriesClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<AdminCategoriesClientProps["categories"][number] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const [pendingDeleteImageIds, setPendingDeleteImageIds] = useState<string[]>([]);

  const attemptDeleteImage = async (imageId: string) => {
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

  const queueDeleteImage = (imageId: string) => {
    setPendingDeleteImageIds((prev) =>
      prev.includes(imageId) ? prev : [...prev, imageId]
    );
  };

  const unqueueDeleteImage = (imageId: string | null) => {
    if (!imageId) {
      return;
    }
    setPendingDeleteImageIds((prev) => prev.filter((id) => id !== imageId));
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", slug: "", imageId: null },
  });

  useEffect(() => {
    if (activeCategory) {
      form.reset({
        name: activeCategory.name,
        slug: activeCategory.slug,
        imageId: activeCategory.image?.id ?? null,
      });
      setSelectedImage(activeCategory.image ?? null);
    } else {
      form.reset({ name: "", slug: "", imageId: null });
      setSelectedImage(null);
    }
  }, [activeCategory, form]);

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setError(null);

    const response = await fetch(
      activeCategory
        ? `/api/admin/categories/${activeCategory.id}`
        : "/api/admin/categories",
      {
        method: activeCategory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }
    );

    const result = (await response.json()) as { success: boolean; error?: string };

    if (!response.ok || !result.success) {
      setError(result.error || "Unable to save category.");
      setSubmitting(false);
      return;
    }

    const pending = pendingDeleteImageIds;
    setPendingDeleteImageIds([]);

    if (pending.length > 0) {
      const failures: string[] = [];
      for (const imageId of pending) {
        const deleted = await attemptDeleteImage(imageId);
        if (!deleted) {
          failures.push(imageId);
        }
      }
      if (failures.length > 0) {
        window.alert("Some images could not be deleted because they are still in use.");
      }
    }

    setOpen(false);
    setActiveCategory(null);
    setSubmitting(false);
    router.refresh();
  };

  const handleDelete = async (categoryId: string) => {
    if (!window.confirm("Delete this category?")) {
      return;
    }

    await fetch(`/api/admin/categories/${categoryId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Categories
          </p>
          <h1 className="heading-font text-3xl font-semibold">Categories</h1>
        </div>
        <Dialog
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (nextOpen && !activeCategory) {
              form.reset({ name: "", slug: "", imageId: null });
              setSelectedImage(null);
            }
            if (!nextOpen) {
              setPendingDeleteImageIds([]);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setActiveCategory(null)}>Add category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {activeCategory ? "Edit category" : "Add category"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Image</Label>
                  <MediaPicker
                    title="Select category image"
                    selectedIds={selectedImage ? [selectedImage.id] : []}
                    onSelect={async (items) => {
                      const image = items[0] ?? null;
                      if (selectedImage && image && selectedImage.id !== image.id) {
                        const shouldDelete = window.confirm(
                          "Delete the previous category image from the media library?"
                        );
                        if (shouldDelete) {
                          queueDeleteImage(selectedImage.id);
                        }
                      }
                      unqueueDeleteImage(image?.id ?? null);
                      setSelectedImage(image);
                      form.setValue("imageId", image?.id ?? null);
                    }}
                    trigger={
                      <Button type="button" variant="outline" size="sm">
                        {selectedImage ? "Change" : "Choose"}
                      </Button>
                    }
                  />
                </div>
                {selectedImage ? (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                      <Image
                        src={selectedImage.url}
                        alt={selectedImage.originalName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">
                        {selectedImage.originalName}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedImage(null);
                        form.setValue("imageId", null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No image selected.</p>
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save category"}
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
              <TableHead>Slug</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveCategory(category);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
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
