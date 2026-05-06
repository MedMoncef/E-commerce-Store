import { buildMetadata } from "@/lib/metadata";
import CheckoutClient from "./checkout-client";

export const metadata = buildMetadata({
  title: "Checkout",
  description: "Secure checkout for your Northwind Outfitters order.",
  path: "/checkout",
});

export default function CheckoutPage() {
  return <CheckoutClient />;
}
