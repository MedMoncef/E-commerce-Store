import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
        404
      </p>
      <h1 className="heading-font mt-3 text-3xl font-semibold">
        We could not find that page.
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        The page may have moved or no longer exists.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Return home</Link>
      </Button>
    </div>
  );
}
