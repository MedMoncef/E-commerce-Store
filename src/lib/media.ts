import crypto from "crypto";
import path from "path";
import { mkdir } from "fs/promises";

import { slugify } from "@/lib/slug";

const DEFAULT_UPLOAD_DIR = "public/uploads";
const DEFAULT_PUBLIC_BASE = "/uploads";

export function getUploadDir() {
  return process.env.MEDIA_UPLOAD_DIR || DEFAULT_UPLOAD_DIR;
}

export function getPublicBaseUrl() {
  return process.env.NEXT_PUBLIC_MEDIA_BASE_URL || DEFAULT_PUBLIC_BASE;
}

export function resolveUploadDir() {
  return path.join(process.cwd(), getUploadDir());
}

export function buildPublicUrl(filename: string) {
  const base = getPublicBaseUrl().replace(/\/$/, "");
  return `${base}/${filename}`;
}

export async function ensureUploadDir() {
  await mkdir(resolveUploadDir(), { recursive: true });
}

export function makeSafeFilename(originalName: string) {
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, ext);
  const slug = slugify(baseName) || "media";
  const suffix = crypto.randomUUID().slice(0, 8);
  return `${slug}-${suffix}${ext || ".bin"}`;
}

export function resolveUploadPath(filename: string) {
  return path.join(resolveUploadDir(), filename);
}
