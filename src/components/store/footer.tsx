import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
        <div className="space-y-3">
          <p className="heading-font text-lg font-semibold">Northwind Outfitters</p>
          <p className="text-sm text-muted-foreground">
            Modern essentials for everyday movement. Designed for comfort, built
            to last.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-foreground">Company</p>
          <div className="flex flex-col gap-2 text-muted-foreground">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/shipping-returns">Shipping & Returns</Link>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-foreground">Legal</p>
          <div className="flex flex-col gap-2 text-muted-foreground">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © 2026 Northwind Outfitters. All rights reserved.
      </div>
    </footer>
  );
}
