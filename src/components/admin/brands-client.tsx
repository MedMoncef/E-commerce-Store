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

type AdminBrandsClientProps = {
  brands: Array<{ id: string; name: string; slug: string }>;
};

export function AdminBrandsClient({ brands }: AdminBrandsClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeBrand, setActiveBrand] = useState<AdminBrandsClientProps["brands"][number] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", slug: "" },
  });

  useEffect(() => {
    if (activeBrand) {
      form.reset({ name: activeBrand.name, slug: activeBrand.slug });
    } else {
      form.reset({ name: "", slug: "" });
    }
  }, [activeBrand, form]);

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setError(null);

    const response = await fetch(
      activeBrand ? `/api/admin/brands/${activeBrand.id}` : "/api/admin/brands",
      {
        method: activeBrand ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }
    );

    const result = (await response.json()) as { success: boolean; error?: string };

    if (!response.ok || !result.success) {
      setError(result.error || "Unable to save brand.");
      setSubmitting(false);
      return;
    }

    setOpen(false);
    setActiveBrand(null);
    setSubmitting(false);
    router.refresh();
  };

  const handleDelete = async (brandId: string) => {
    if (!window.confirm("Delete this brand?")) {
      return;
    }

    await fetch(`/api/admin/brands/${brandId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Brands
          </p>
          <h1 className="heading-font text-3xl font-semibold">Brands</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setActiveBrand(null)}>Add brand</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {activeBrand ? "Edit brand" : "Add brand"}
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
                  {submitting ? "Saving..." : "Save brand"}
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
            {brands.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell className="font-medium">{brand.name}</TableCell>
                <TableCell>{brand.slug}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveBrand(brand);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(brand.id)}
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
