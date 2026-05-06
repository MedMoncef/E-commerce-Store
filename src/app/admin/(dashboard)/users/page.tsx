import { AdminUsersClient } from "@/components/admin/users-client";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Admin Users",
  description: "Manage customer accounts and admin access.",
  path: "/admin/users",
});

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const formatted = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
  }));

  return <AdminUsersClient users={formatted} />;
}
