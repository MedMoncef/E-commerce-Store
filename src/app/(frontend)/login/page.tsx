import { buildMetadata } from "@/lib/metadata";
import LoginClient from "./login-client";

export const metadata = buildMetadata({
  title: "Sign in",
  description: "Sign in to your Northwind Outfitters account.",
  path: "/login",
});

export default function LoginPage() {
  return <LoginClient />;
}
