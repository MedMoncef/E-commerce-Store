"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import type { MediaItem } from "@/types/media";

function formatBytes(size?: number) {
  if (!size && size !== 0) return "-";
  if (size < 1024) return `${size} B`;
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function MediaLibraryClient() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    fetchMedia();
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
    </div>
  );
}
