import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "About",
  description: "Learn about the Northwind Outfitters team and our mission.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
        About
      </p>
      <h1 className="heading-font mt-3 text-3xl font-semibold">
        Crafted for the everyday city rhythm.
      </h1>
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        <p>
          Northwind Outfitters designs modern apparel for people who move through
          the day with intention. We combine quiet palettes, elevated fabrics,
          and considered fits to build staples that last across seasons.
        </p>
        <p>
          From soft layering pieces to tailored outerwear, every product is
          engineered for comfort and versatility. We partner with suppliers who
          prioritize responsible sourcing and transparency.
        </p>
        <p>
          Our goal is to deliver pieces you can reach for daily, with a
          contemporary edge that makes each look feel intentional.
        </p>
      </div>
    </div>
  );
}
