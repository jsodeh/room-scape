import { HttpError } from "../security.ts";
export interface ImageInfo {
  mimeType: string;
  extension: string;
  width: number;
  height: number;
}
export function inspectImage(bytes: Uint8Array): ImageInfo {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    bytes.length >= 24 && bytes[0] === 137 && bytes[1] === 80 &&
    bytes[2] === 78 && bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10
  ) {
    return valid({
      mimeType: "image/png",
      extension: "png",
      width: view.getUint32(16),
      height: view.getUint32(20),
    });
  }
  if (bytes.length > 4 && bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset++] !== 255) continue;
      const marker = bytes[offset++];
      if (marker === 255 || marker === 0 || marker === 216) continue;
      if (marker === 217 || marker === 218) break;
      if (offset + 2 > bytes.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if (
        [192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207]
          .includes(marker)
      ) {
        return valid({
          mimeType: "image/jpeg",
          extension: "jpg",
          height: view.getUint16(offset + 3),
          width: view.getUint16(offset + 5),
        });
      }
      offset += length;
    }
  }
  if (
    bytes.length >= 30 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    const type = String.fromCharCode(...bytes.slice(12, 16));
    if (type === "VP8X") {
      return valid({
        mimeType: "image/webp",
        extension: "webp",
        width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
        height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
      });
    }
    if (type === "VP8 ") {
      return valid({
        mimeType: "image/webp",
        extension: "webp",
        width: view.getUint16(26, true) & 16383,
        height: view.getUint16(28, true) & 16383,
      });
    }
    if (type === "VP8L") {
      const v = view.getUint32(21, true);
      return valid({
        mimeType: "image/webp",
        extension: "webp",
        width: (v & 16383) + 1,
        height: ((v >>> 14) & 16383) + 1,
      });
    }
  }
  throw new HttpError(
    422,
    "The provider did not return a readable JPG, PNG or WebP image.",
  );
}
function valid(info: ImageInfo) {
  if (
    !info.width || !info.height || info.width > 16384 || info.height > 16384
  ) throw new HttpError(422, "Invalid image dimensions.");
  return info;
}
export function decodeImage(data: string, claimedMime?: string) {
  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(
      atob(data.replace(/^data:[^,]+,/, "")),
      (c) => c.charCodeAt(0),
    );
  } catch {
    throw new HttpError(422, "The image response was malformed.");
  }
  if (bytes.byteLength > 50 * 1024 * 1024) {
    throw new HttpError(413, "The generated image exceeds the storage limit.");
  }
  const info = inspectImage(bytes);
  if (claimedMime && claimedMime !== info.mimeType) {
    throw new HttpError(
      422,
      "The returned image format did not match its content.",
    );
  }
  return { bytes, ...info };
}
export async function sha256(value: string | Uint8Array): Promise<string> {
  const bytes = typeof value === "string"
    ? new TextEncoder().encode(value)
    : value;
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", bytes as BufferSource),
    ),
  ].map((x) => x.toString(16).padStart(2, "0")).join("");
}
export async function stableId(value: string): Promise<string> {
  const hex = await sha256(value);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${
    hex.slice(17, 20)
  }-${hex.slice(20, 32)}`;
}
export function base64(bytes: Uint8Array) {
  let text = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(text);
}
