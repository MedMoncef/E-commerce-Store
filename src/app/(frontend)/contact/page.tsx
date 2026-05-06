import { buildMetadata } from "@/lib/metadata";
import ContactClient from "./contact-client";

export const metadata = buildMetadata({
  title: "Contact",
  description: "Reach out to Northwind Outfitters for support or questions.",
  path: "/contact",
});

export default function ContactPage() {
  return <ContactClient />;
}
