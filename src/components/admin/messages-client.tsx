"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AdminMessagesClientProps = {
  messages: Array<{
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  }>;
};

export function AdminMessagesClient({ messages }: AdminMessagesClientProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  const markRead = async (id: string) => {
    setUpdating(id);
    await fetch(`/api/admin/messages/${id}`, { method: "PATCH" });
    window.location.reload();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this message?")) {
      return;
    }
    setUpdating(id);
    await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Messages
        </p>
        <h1 className="heading-font text-3xl font-semibold">Messages</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sender</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.map((message) => (
              <TableRow key={message.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{message.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {message.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{message.subject}</TableCell>
                <TableCell>
                  <Badge variant={message.isRead ? "outline" : "default"}>
                    {message.isRead ? "Read" : "New"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(message.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{message.subject}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 text-sm text-muted-foreground">
                          <div>
                            <p className="font-medium text-foreground">
                              {message.name}
                            </p>
                            <p>{message.email}</p>
                          </div>
                          <p>{message.message}</p>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {!message.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updating === message.id}
                        onClick={() => markRead(message.id)}
                      >
                        Mark read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={updating === message.id}
                      onClick={() => remove(message.id)}
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
