import { buildMetadata } from "@/lib/metadata";
import AdminLoginClient from "./login-client";

export const metadata = buildMetadata({
  title: "Admin Login",
  description: "Sign in to the Northwind Outfitters admin dashboard.",
  path: "/admin/login",
});

export default function AdminLoginPage() {
  return <AdminLoginClient />;
}
