"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Badge } from "@/components/ui/badge";
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

const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(6).optional()
  ),
  role: z.enum(["USER", "ADMIN"]),
});

type FormValues = z.infer<typeof formSchema>;

type AdminUsersClientProps = {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN";
    createdAt: string;
  }>;
};

export function AdminUsersClient({ users }: AdminUsersClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<AdminUsersClientProps["users"][number] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "", role: "USER" },
  });

  useEffect(() => {
    if (activeUser) {
      form.reset({
        name: activeUser.name,
        email: activeUser.email,
        password: "",
        role: activeUser.role,
      });
    } else {
      form.reset({ name: "", email: "", password: "", role: "USER" });
    }
  }, [activeUser, form]);

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setError(null);

    if (!activeUser && !values.password) {
      setError("Password is required for new users.");
      setSubmitting(false);
      return;
    }

    const payload = {
      name: values.name,
      email: values.email,
      role: values.role,
      ...(values.password ? { password: values.password } : {}),
    };

    const response = await fetch(
      activeUser ? `/api/admin/users/${activeUser.id}` : "/api/admin/users",
      {
        method: activeUser ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const result = (await response.json()) as { success: boolean; error?: string };

    if (!response.ok || !result.success) {
      setError(result.error || "Unable to save user.");
      setSubmitting(false);
      return;
    }

    setOpen(false);
    setActiveUser(null);
    setSubmitting(false);
    router.refresh();
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Delete this user?")) {
      return;
    }

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
    });
    const result = (await response.json()) as { success: boolean; error?: string };

    if (!response.ok || !result.success) {
      setError(result.error || "Unable to delete user.");
      return;
    }

    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Users
          </p>
          <h1 className="heading-font text-3xl font-semibold">Users</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setActiveUser(null)}>Add user</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {activeUser ? "Edit user" : "Add user"}
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
                <Label>Email</Label>
                <Input type="email" {...form.register("email")} />
              </div>
              <div className="space-y-2">
                <Label>
                  {activeUser ? "New password (optional)" : "Password"}
                </Label>
                <Input type="password" {...form.register("password")} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  {...form.register("role")}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save user"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveUser(user);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
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
