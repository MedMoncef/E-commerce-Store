"use client";

import { useMemo, useState } from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredMessages = useMemo(() => {
    const term = search.trim().toLowerCase();
    return messages.filter((message) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "READ" ? message.isRead : !message.isRead);
      if (!matchesStatus) {
        return false;
      }
      if (!term) {
        return true;
      }
      const details = [
        message.name,
        message.email,
        message.subject,
        message.message,
      ]
        .join(" ")
        .toLowerCase();
      return details.includes(term);
    });
  }, [messages, search, statusFilter]);

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

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-55 flex-1">
            <Label
              htmlFor="message-search"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Search
            </Label>
            <Input
              id="message-search"
              type="search"
              placeholder="Search messages"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="min-w-50">
            <Label
              htmlFor="message-status"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Status
            </Label>
            <select
              id="message-status"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All</option>
              <option value="UNREAD">Unread</option>
              <option value="READ">Read</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            {filteredMessages.length} result{filteredMessages.length === 1 ? "" : "s"}
          </p>
        </div>
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
            {filteredMessages.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No messages match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredMessages.map((message) => (
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
