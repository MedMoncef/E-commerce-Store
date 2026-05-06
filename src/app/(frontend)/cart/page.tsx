import { buildMetadata } from "@/lib/metadata";
import CartClient from "./cart-client";

export const metadata = buildMetadata({
  title: "Cart",
  description: "Review items in your shopping cart before checkout.",
  path: "/cart",
});

export default function CartPage() {
  return <CartClient />;
}
