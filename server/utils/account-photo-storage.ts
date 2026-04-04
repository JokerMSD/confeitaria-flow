import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";

const ACCOUNT_UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "account");
const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function isLocalAccountPhoto(url: string | null | undefined) {
  return Boolean(url && url.startsWith("/uploads/account/"));
}

export async function saveAccountPhoto(input: {
  userId: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  contentBase64: string;
  previousPhotoUrl?: string | null;
}) {
  const extension = EXTENSION_BY_MIME_TYPE[input.mimeType];
  const buffer = Buffer.from(input.contentBase64, "base64");

  if (!extension || buffer.length === 0) {
    throw new Error("Arquivo de imagem invalido.");
  }

  if (buffer.length > MAX_PHOTO_SIZE_BYTES) {
    throw new Error("A foto deve ter no maximo 2 MB.");
  }

  await mkdir(ACCOUNT_UPLOAD_DIR, { recursive: true });

  if (isLocalAccountPhoto(input.previousPhotoUrl)) {
    const previousFilePath = path.resolve(
      process.cwd(),
      input.previousPhotoUrl!.slice(1),
    );
    await rm(previousFilePath, { force: true });
  }

  const fileName = `${input.userId}-${Date.now()}${extension}`;
  const absoluteFilePath = path.join(ACCOUNT_UPLOAD_DIR, fileName);
  await writeFile(absoluteFilePath, buffer);

  return `/uploads/account/${fileName}`;
}

export async function removeAccountPhoto(photoUrl?: string | null) {
  if (!isLocalAccountPhoto(photoUrl)) {
    return;
  }

  const absoluteFilePath = path.resolve(process.cwd(), photoUrl!.slice(1));
  await rm(absoluteFilePath, { force: true });
}
