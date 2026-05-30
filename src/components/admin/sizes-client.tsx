"use client";

import { useEffect, useMemo, useState } from "react";
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

type AdminSizesClientProps = {
  sizes: Array<{ id: string; name: string; slug: string }>;
};

export function AdminSizesClient({ sizes }: AdminSizesClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeSize, setActiveSize] = useState<AdminSizesClientProps["sizes"][number] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredSizes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return sizes;
    }
    return sizes.filter((size) =>
      [size.name, size.slug].some((value) =>
        value.toLowerCase().includes(term)
      )
    );
  }, [sizes, search]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", slug: "" },
  });

  useEffect(() => {
    if (activeSize) {
      form.reset({ name: activeSize.name, slug: activeSize.slug });
    } else {
      form.reset({ name: "", slug: "" });
    }
  }, [activeSize, form]);

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setError(null);

    const response = await fetch(
      activeSize ? `/api/admin/sizes/${activeSize.id}` : "/api/admin/sizes",
      {
        method: activeSize ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }
    );

    const result = (await response.json()) as { success: boolean; error?: string };

    if (!response.ok || !result.success) {
      setError(result.error || "Unable to save size.");
      setSubmitting(false);
      return;
    }

    setOpen(false);
    setActiveSize(null);
    setSubmitting(false);
    router.refresh();
  };

  const handleDelete = async (sizeId: string) => {
    if (!window.confirm("Delete this size?")) {
      return;
    }

    await fetch(`/api/admin/sizes/${sizeId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Sizes
          </p>
          <h1 className="heading-font text-3xl font-semibold">Sizes</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setActiveSize(null)}>Add size</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{activeSize ? "Edit size" : "Add size"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                      form.setValue("slug", slugify(form.getValues("name")))
                    }
                  >
                    Generate
                  </Button>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save size"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-55 flex-1">
            <Label
              htmlFor="size-search"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Search
            </Label>
            <Input
              id="size-search"
              type="search"
              placeholder="Search sizes"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {filteredSizes.length} result{filteredSizes.length === 1 ? "" : "s"}
          </p>
        </div>
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
            {filteredSizes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No sizes match your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredSizes.map((size) => (
                <TableRow key={size.id}>
                  <TableCell className="font-medium">{size.name}</TableCell>
                  <TableCell>{size.slug}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveSize(size);
                          setOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(size.id)}
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
    </div>
  );
}
