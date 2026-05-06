import { redirect } from "next/navigation";

import { AccountClient } from "@/components/store/account-client";
import { auth } from "@/lib/auth";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Account",
  description: "Manage your profile, orders, and favorites.",
  path: "/account",
});

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <AccountClient user={session.user} />;
}
