import { buildMetadata } from "@/lib/metadata";
import RegisterClient from "./register-client";

export const metadata = buildMetadata({
  title: "Register",
  description: "Create a Northwind Outfitters account.",
  path: "/register",
});

export default function RegisterPage() {
  return <RegisterClient />;
}
