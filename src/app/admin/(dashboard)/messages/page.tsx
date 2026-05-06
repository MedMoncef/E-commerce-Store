import { AdminMessagesClient } from "@/components/admin/messages-client";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Admin Messages",
  description: "Manage incoming contact messages.",
  path: "/admin/messages",
});

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  const formatted = messages.map((message) => ({
    id: message.id,
    name: message.name,
    email: message.email,
    subject: message.subject,
    message: message.message,
    isRead: message.isRead,
    createdAt: message.createdAt.toISOString(),
  }));

  return <AdminMessagesClient messages={formatted} />;
}
