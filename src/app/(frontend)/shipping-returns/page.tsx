import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Shipping & Returns",
  description: "Learn about our shipping timelines and return policy.",
  path: "/shipping-returns",
});

export default function ShippingReturnsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Shipping & Returns
      </p>
      <h1 className="heading-font mt-3 text-3xl font-semibold">
        Shipping made simple.
      </h1>
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        <p>
          Orders ship within 2-3 business days. You will receive tracking details
          as soon as your package leaves our studio.
        </p>
        <p>
          Returns are accepted within 30 days of delivery. Items must be unworn
          and in original condition.
        </p>
        <p>
          To start a return, contact our support team with your order number and
          we will guide you through the process.
        </p>
      </div>
    </div>
  );
}
