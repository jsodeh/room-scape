import { supabase } from "@/integrations/supabase/client";
import { prepareRoomImage } from "@/utils/prepareRoomImage";
export async function designRequest<T>(
  action: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("design-api", {
    body: { ...body, action },
  });
  if (error) {
    let message = error.message;
    if ("context" in error && error.context instanceof Response) {
      try {
        message = (await error.context.json()).error || message;
      } catch {
        /* Use the transport error. */
      }
    }
    throw new Error(
      message || "The design could not be saved. Please try again.",
    );
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}
export async function uploadDesignPhoto(
  file: File,
  userId: string,
  projectId: string,
): Promise<string> {
  const prepared = await prepareRoomImage(file);
  const path = `${userId}/${projectId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from("room-images")
    .upload(path, prepared, { contentType: "image/jpeg", upsert: false });
  if (error)
    throw new Error("Your photograph could not be uploaded. Please try again.");
  return supabase.storage.from("room-images").getPublicUrl(path).data.publicUrl;
}
export async function downloadDesign(url: string, mime: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("The image could not be downloaded.");
  const blob = await response.blob(),
    objectURL = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectURL;
  link.download = `roomscape-design.${mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg"}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
}
