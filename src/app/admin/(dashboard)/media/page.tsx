import { MediaLibraryClient } from "@/components/admin/media-library-client";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Media Library",
  description: "Browse and manage uploaded images.",
  path: "/admin/media",
});

export const dynamic = "force-dynamic";

export default function MediaLibraryPage() {
  return <MediaLibraryClient />;
}
