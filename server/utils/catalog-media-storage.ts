import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";

const CATALOG_UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "catalog");
const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function isLocalCatalogMedia(url: string | null | undefined) {
  return Boolean(url && url.startsWith("/uploads/catalog/"));
}

export async function saveCatalogMedia(input: {
  recipeId: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  contentBase64: string;
}) {
  const extension = EXTENSION_BY_MIME_TYPE[input.mimeType];
  const buffer = Buffer.from(input.contentBase64, "base64");

  if (!extension || buffer.length === 0) {
    throw new Error("Arquivo de imagem invalido.");
  }

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("A imagem deve ter no maximo 3 MB.");
  }

  await mkdir(CATALOG_UPLOAD_DIR, { recursive: true });
  const fileName = `${input.recipeId}-${Date.now()}${extension}`;
  const absoluteFilePath = path.join(CATALOG_UPLOAD_DIR, fileName);
  await writeFile(absoluteFilePath, buffer);

  return `/uploads/catalog/${fileName}`;
}

export async function removeCatalogMedia(fileUrl?: string | null) {
  if (!isLocalCatalogMedia(fileUrl)) {
    return;
  }

  const absoluteFilePath = path.resolve(process.cwd(), fileUrl!.slice(1));
  await rm(absoluteFilePath, { force: true });
}
