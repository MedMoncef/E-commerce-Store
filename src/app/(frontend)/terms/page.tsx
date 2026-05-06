import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Terms of Service",
  description: "Review the terms for using our store and services.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Terms of Service
      </p>
      <h1 className="heading-font mt-3 text-3xl font-semibold">
        Store terms and conditions.
      </h1>
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        <p>
          By placing an order, you agree to provide accurate information and use
          the store in good faith. Prices and availability may change without
          notice.
        </p>
        <p>
          Orders may be declined if payment verification fails or inventory is
          unavailable. We will notify you promptly if this occurs.
        </p>
        <p>
          All content on this site is owned by Northwind Outfitters and may not
          be reproduced without permission.
        </p>
      </div>
    </div>
  );
}
