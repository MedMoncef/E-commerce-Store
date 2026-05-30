import { writeFile } from "fs/promises";

import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess, requireAdmin } from "@/lib/api-helpers";
import {
  buildPublicUrl,
  ensureUploadDir,
  makeSafeFilename,
  resolveUploadPath,
} from "@/lib/media";

function isFile(value: FormDataEntryValue | null): value is File {
  return value !== null && typeof value === "object" && "arrayBuffer" in value;
}

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      url: true,
      originalName: true,
      size: true,
      createdAt: true,
    },
  });

  return jsonSuccess(media);
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const formData = await request.formData();
  const files = formData.getAll("files");
  const entries =
    files.length > 0 ? files : [formData.get("file")].filter((item) => item !== null);
  const uploads = entries.filter(isFile);

  if (uploads.length === 0) {
    return jsonError("No files provided.");
  }

  await ensureUploadDir();

  const created = [] as Array<{
    id: string;
    url: string;
    originalName: string;
    size: number;
    createdAt: Date;
  }>;

  for (const file of uploads) {
    if (!file.type.startsWith("image/")) {
      return jsonError("Only image uploads are supported.");
    }

    const filename = makeSafeFilename(file.name || "upload");
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(resolveUploadPath(filename), buffer);

    const media = await prisma.media.create({
      data: {
        filename,
        originalName: file.name || filename,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        url: buildPublicUrl(filename),
      },
      select: {
        id: true,
        url: true,
        originalName: true,
        size: true,
        createdAt: true,
      },
    });

    created.push(media);
  }

  return jsonSuccess(created, { status: 201 });
}
