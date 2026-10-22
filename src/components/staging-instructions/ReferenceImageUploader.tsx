import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/services/fileStorageService";
import { prepareRoomImage } from "@/utils/prepareRoomImage";
import ReferenceImageAnalyzer from "./ReferenceImageAnalyzer";
interface ReferenceImageUploaderProps {
  onReferenceImageChange: (file: File | null) => void;
  onReferenceImageUpload?: (url: string | null) => void;
  onAnalysisInstructionsGenerated?: (instructions: string) => void;
  disabled?: boolean;
}
export default function ReferenceImageUploader({
  onReferenceImageChange,
  onReferenceImageUpload,
  onAnalysisInstructionsGenerated,
  disabled = false,
}: ReferenceImageUploaderProps) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const select = async (file?: File) => {
    if (!file || uploading || disabled) return;
    setUploading(true);
    try {
      const prepared = await prepareRoomImage(file);
      const uploadedUrl = onReferenceImageUpload
        ? await uploadImage(prepared, "reference-images")
        : null;
      if (onReferenceImageUpload && !uploadedUrl)
        throw new Error("The reference image could not be uploaded.");
      setPreview(URL.createObjectURL(prepared));
      setUrl(uploadedUrl);
      onReferenceImageChange(prepared);
      onReferenceImageUpload?.(uploadedUrl);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Please try another reference image.",
      );
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  };
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium">A little visual inspiration</p>
      <p className="text-[11px] text-muted-foreground">
        Add a reference, then analyse it to apply its style to your brief.
      </p>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Upload reference image"
        className="hidden"
        onChange={(event) => void select(event.target.files?.[0])}
        disabled={disabled || uploading}
      />
      {preview ? (
        <div className="overflow-hidden rounded-lg border">
          <div className="relative">
            <img
              src={preview}
              alt="Your style reference"
              className="h-32 w-full object-contain bg-secondary"
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-2 top-2 h-7 w-7"
              aria-label="Remove reference image"
              disabled={disabled || uploading}
              onClick={() => {
                setPreview(null);
                setUrl(null);
                onReferenceImageChange(null);
                onReferenceImageUpload?.(null);
              }}
            >
              <X />
            </Button>
          </div>
          {url && (
            <div className="p-3">
              <ReferenceImageAnalyzer
                referenceImageUrl={url}
                onInstructionsGenerated={(value) =>
                  onAnalysisInstructionsGenerated?.(value)
                }
              />
            </div>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-auto w-full whitespace-normal border-dashed py-4 text-xs"
          disabled={disabled || uploading}
          onClick={() => input.current?.click()}
        >
          {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          {uploading ? "Preparing reference…" : "Add reference image"}
        </Button>
      )}
    </div>
  );
}
