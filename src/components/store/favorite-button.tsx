"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";

type FavoriteButtonProps = {
  productId: string;
};

export function FavoriteButton({ productId }: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  const handleClick = async () => {
    if (!session) {
      window.location.href = "/login";
      return;
    }

    setStatus("saving");

    const response = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });

    const result = (await response.json()) as {
      success: boolean;
      error?: string;
    };

    if (!response.ok || !result.success) {
      setStatus("error");
      return;
    }

    setStatus("saved");
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full"
        disabled={status === "saving"}
        onClick={handleClick}
      >
        <Heart className="h-4 w-4" />
        {status === "saved"
          ? "Saved"
          : status === "saving"
            ? "Saving..."
            : "Save to favorites"}
      </Button>
      {status === "error" ? (
        <p className="text-xs text-destructive">Unable to save favorite.</p>
      ) : null}
    </div>
  );
}
