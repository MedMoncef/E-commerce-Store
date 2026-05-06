"use client";

import { useEffect, useState } from "react";
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

const formSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
});

type FormValues = z.infer<typeof formSchema>;

type AdminCategoriesClientProps = {
  categories: Array<{ id: string; name: string; slug: string }>;
};

export function AdminCategoriesClient({
  categories,
}: AdminCategoriesClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<AdminCategoriesClientProps["categories"][number] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", slug: "" },
  });

  useEffect(() => {
    if (activeCategory) {
      form.reset({ name: activeCategory.name, slug: activeCategory.slug });
    } else {
      form.reset({ name: "", slug: "" });
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
        <Dialog open={open} onOpenChange={setOpen}>
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
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      form.setValue(
                        "slug",
                        slugify(form.getValues("name"))
                      )
                    }
                  >
                    Generate
                  </Button>
                  <Input className="flex-1" {...form.register("slug")} />
                </div>
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
