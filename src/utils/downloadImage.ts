import { toast } from "sonner";
export async function downloadImage(url: string, filename: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Download failed");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const extensions: Record<string, string> = {
      "image/png": "png",
      "image/webp": "webp",
      "image/jpeg": "jpg",
    };
    link.href = objectUrl;
    link.download = extensions[blob.type]
      ? filename.replace(/\.[^/.]+$/, "." + extensions[blob.type])
      : filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    toast.success("Your image is ready to download.");
  } catch {
    toast.error("We could not download this image. Please try again.");
  }
}
