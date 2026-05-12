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

type AdminColorsClientProps = {
  colors: Array<{ id: string; name: string; slug: string }>;
};

export function AdminColorsClient({ colors }: AdminColorsClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeColor, setActiveColor] = useState<AdminColorsClientProps["colors"][number] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", slug: "" },
  });

  useEffect(() => {
    if (activeColor) {
      form.reset({ name: activeColor.name, slug: activeColor.slug });
    } else {
      form.reset({ name: "", slug: "" });
    }
  }, [activeColor, form]);

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setError(null);

    const response = await fetch(
      activeColor ? `/api/admin/colors/${activeColor.id}` : "/api/admin/colors",
      {
        method: activeColor ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }
    );

    const result = (await response.json()) as { success: boolean; error?: string };

    if (!response.ok || !result.success) {
      setError(result.error || "Unable to save color.");
      setSubmitting(false);
      return;
    }

    setOpen(false);
    setActiveColor(null);
    setSubmitting(false);
    router.refresh();
  };

  const handleDelete = async (colorId: string) => {
    if (!window.confirm("Delete this color?")) {
      return;
    }

    await fetch(`/api/admin/colors/${colorId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Colors
          </p>
          <h1 className="heading-font text-3xl font-semibold">Colors</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setActiveColor(null)}>Add color</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{activeColor ? "Edit color" : "Add color"}</DialogTitle>
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
                  {submitting ? "Saving..." : "Save color"}
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
            {colors.map((color) => (
              <TableRow key={color.id}>
                <TableCell className="font-medium">{color.name}</TableCell>
                <TableCell>{color.slug}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveColor(color);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(color.id)}
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
