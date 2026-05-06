import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description: "Understand how we handle your personal information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Privacy Policy
      </p>
      <h1 className="heading-font mt-3 text-3xl font-semibold">
        Your privacy matters.
      </h1>
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        <p>
          We collect only the information needed to fulfill orders, provide
          support, and improve the experience. This includes contact details,
          shipping addresses, and order history.
        </p>
        <p>
          We never sell your data. We share information only with trusted
          partners required to process payments, deliver packages, or comply
          with legal obligations.
        </p>
        <p>
          You can request data access or deletion at any time by contacting our
          support team.
        </p>
      </div>
    </div>
  );
}
