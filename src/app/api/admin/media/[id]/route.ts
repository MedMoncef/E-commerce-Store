import { unlink } from "fs/promises";

import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";
import { resolveUploadPath } from "@/lib/media";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const { id } = await params;

  const media = await prisma.media.findUnique({
    where: { id },
    include: {
      featuredFor: { select: { id: true } },
      productImages: { select: { id: true } },
      brandImages: { select: { id: true } },
      categoryImages: { select: { id: true } },
    },
  });

  if (!media) {
    return jsonError("Image not found.", 404);
  }

  if (
    media.featuredFor.length > 0 ||
    media.productImages.length > 0 ||
    media.brandImages.length > 0 ||
    media.categoryImages.length > 0
  ) {
    return jsonError("Image is in use and cannot be deleted.");
  }

  await prisma.media.delete({ where: { id } });

  try {
    await unlink(resolveUploadPath(media.filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  return jsonSuccess({ deleted: true });
}
