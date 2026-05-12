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
  DialogTrigger,
} from "@/components/ui/dialog";
import type { MediaItem } from "@/types/media";

type MediaPickerProps = {
  title: string;
  trigger: React.ReactNode;
  onSelect: (items: MediaItem[]) => void;
  selectedIds?: string[];
  multiple?: boolean;
};

export function MediaPicker({
  title,
  trigger,
  onSelect,
  selectedIds = [],
  multiple = false,
}: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<string[]>(selectedIds);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    const response = await fetch("/api/admin/media");
    const result = (await response.json()) as {
      success: boolean;
      data?: MediaItem[];
      error?: string;
    };

    if (response.ok && result.success && result.data) {
      setMedia(result.data);
    } else {
      setError(result.error || "Unable to load media.");
    }
  };

  useEffect(() => {
    if (open) {
      setSelected(selectedIds);
      fetchMedia();
    }
  }, [open, selectedIds]);

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
    setSelected((prev) => {
      const incoming = result.data!.map((item) => item.id);
      return multiple ? Array.from(new Set([...incoming, ...prev])) : incoming;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleSelect = (id: string) => {
    if (multiple) {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
      return;
    }
    setSelected([id]);
  };

  const handleConfirm = () => {
    const selectedItems = media.filter((item) => selected.includes(item.id));
    if (selectedItems.length === 0) {
      setError("Select at least one image.");
      return;
    }
    onSelect(selectedItems);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            className="hidden"
            onChange={(event) => handleUpload(event.target.files)}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            Upload new
          </Button>
          <p className="text-xs text-muted-foreground">
            {multiple ? "Select multiple images." : "Select one image."}
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {media.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">No images available.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {media.map((item) => {
              const isSelected = selected.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`rounded-2xl border p-2 text-left transition ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40"
                  }`}
                  onClick={() => toggleSelect(item.id)}
                >
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-muted/40">
                    <Image src={item.url} alt={item.originalName} fill className="object-cover" />
                  </div>
                  <p className="mt-2 text-xs font-medium line-clamp-1">
                    {item.originalName}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleConfirm} disabled={selected.length === 0}>
            Use selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
