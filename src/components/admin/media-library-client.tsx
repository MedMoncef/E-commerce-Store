"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { MediaItem } from "@/types/media";

const RAW_UNUSED_AGE_HOURS = Number(
  process.env.NEXT_PUBLIC_UNUSED_MEDIA_AGE_HOURS || "168"
);
const UNUSED_AGE_HOURS = Number.isFinite(RAW_UNUSED_AGE_HOURS) && RAW_UNUSED_AGE_HOURS > 0
  ? RAW_UNUSED_AGE_HOURS
  : 168;
const UNUSED_AGE_LABEL = UNUSED_AGE_HOURS % 24 === 0
  ? `${UNUSED_AGE_HOURS / 24} days`
  : `${UNUSED_AGE_HOURS} hours`;

function formatBytes(size?: number) {
  if (!size && size !== 0) return "-";
  if (size < 1024) return `${size} B`;
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export function MediaLibraryClient() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unusedCount, setUnusedCount] = useState(0);
  const [unusedItems, setUnusedItems] = useState<MediaItem[]>([]);
  const [unusedOpen, setUnusedOpen] = useState(false);
  const [unusedLoading, setUnusedLoading] = useState(false);
  const [unusedError, setUnusedError] = useState<string | null>(null);
  const [selectedUnused, setSelectedUnused] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/admin/media");
    const result = (await response.json()) as {
      success: boolean;
      data?: MediaItem[];
      error?: string;
    };

    if (response.ok && result.success && result.data) {
      setMedia(result.data);
    } else {
      setError(result.error || "Unable to load media library.");
    }

    setLoading(false);
  };

  const fetchUnusedCount = async () => {
    const response = await fetch(
      `/api/admin/media/unused?hours=${UNUSED_AGE_HOURS}`
    );
    const result = (await response.json()) as {
      success: boolean;
      data?: { count: number };
      error?: string;
    };

    if (response.ok && result.success && result.data) {
      setUnusedCount(result.data.count);
    } else {
      setUnusedError(result.error || "Unable to load unused image count.");
    }
  };

  const fetchUnusedItems = async () => {
    setUnusedLoading(true);
    setUnusedError(null);

    const response = await fetch(
      `/api/admin/media/unused?hours=${UNUSED_AGE_HOURS}&include=1`
    );
    const result = (await response.json()) as {
      success: boolean;
      data?: { count: number; items: MediaItem[] };
      error?: string;
    };

    if (response.ok && result.success && result.data) {
      setUnusedItems(result.data.items);
      setUnusedCount(result.data.count);
      setSelectedUnused([]);
    } else {
      setUnusedError(result.error || "Unable to load unused images.");
    }

    setUnusedLoading(false);
  };

  useEffect(() => {
    fetchMedia();
    fetchUnusedCount();
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setError(null);

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    const response = await fetch("/api/admin/media", {
      method: "POST",
      body: formData,
    });

    const result = (await response.json()) as {
      success: boolean;
      data?: MediaItem[];
      error?: string;
    };

    if (!response.ok || !result.success || !result.data) {
      setError(result.error || "Upload failed.");
      return;
    }

    setMedia((prev) => [...result.data!, ...prev]);
    fetchUnusedCount();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this image?")) {
      return;
    }

    const response = await fetch(`/api/admin/media/${id}`, {
      method: "DELETE",
    });
    const result = (await response.json()) as { success: boolean; error?: string };

    if (!response.ok || !result.success) {
      setError(result.error || "Unable to delete image.");
      return;
    }

    setMedia((prev) => prev.filter((item) => item.id !== id));
    setUnusedItems((prev) => prev.filter((item) => item.id !== id));
    setSelectedUnused((prev) => prev.filter((item) => item !== id));
    fetchUnusedCount();
  };

  const handleReviewUnused = async () => {
    setUnusedOpen(true);
    await fetchUnusedItems();
  };

  const toggleUnusedSelection = (id: string) => {
    setSelectedUnused((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteUnused = async () => {
    if (selectedUnused.length === 0) {
      return;
    }

    if (!window.confirm("Delete selected unused images?")) {
      return;
    }

    setUnusedLoading(true);
    setUnusedError(null);

    const failed: string[] = [];

    for (const id of selectedUnused) {
      const response = await fetch(`/api/admin/media/${id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!response.ok || !result.success) {
        failed.push(result.error || "Unable to delete image.");
        continue;
      }

      setMedia((prev) => prev.filter((item) => item.id !== id));
      setUnusedItems((prev) => prev.filter((item) => item.id !== id));
    }

    setSelectedUnused([]);
    await fetchUnusedCount();

    if (failed.length > 0) {
      setUnusedError(failed[0]);
    }

    setUnusedLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Media
          </p>
          <h1 className="heading-font text-3xl font-semibold">Media library</h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => handleUpload(event.target.files)}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            Upload images
          </Button>
        </div>
      </div>

      {unusedCount > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Unused images detected</p>
              <p className="text-xs text-amber-800">
                {unusedCount} image{unusedCount === 1 ? "" : "s"} older than {UNUSED_AGE_LABEL}
                aren&apos;t used by products, brands, or categories.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleReviewUnused}>
              Review unused
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading media...</p>
      ) : media.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">No images yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="relative aspect-video overflow-hidden rounded-xl bg-muted/40">
                <Image src={item.url} alt={item.originalName} fill className="object-cover" />
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-sm font-medium line-clamp-1">
                  {item.originalName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(item.size)}
                </p>
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={unusedOpen} onOpenChange={setUnusedOpen}>
        <DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Unused images</DialogTitle>
          </DialogHeader>

          {unusedError && <p className="text-sm text-destructive">{unusedError}</p>}

          {unusedLoading ? (
            <p className="text-sm text-muted-foreground">Loading unused images...</p>
          ) : unusedItems.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">No unused images.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {unusedItems.map((item) => {
                const selected = selectedUnused.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`rounded-2xl border p-3 text-left transition ${
                      selected
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40"
                    }`}
                    onClick={() => toggleUnusedSelection(item.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selected}
                      />
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-muted/40">
                        <Image
                          src={item.url}
                          alt={item.originalName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-1">
                          {item.originalName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(item.size)} · {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <DialogFooter>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUnused(unusedItems.map((item) => item.id))}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUnused([])}
                >
                  Clear
                </Button>
              </div>
              <Button
                type="button"
                onClick={handleDeleteUnused}
                disabled={selectedUnused.length === 0 || unusedLoading}
              >
                Delete selected
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
