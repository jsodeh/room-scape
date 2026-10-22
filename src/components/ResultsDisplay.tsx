import { useState } from "react";
import {
  Download,
  Expand,
  History,
  Loader2,
  Pencil,
  Plus,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import RoomComparison from "./results-display/RoomComparison";
import { downloadImage } from "@/utils/downloadImage";
interface ResultsDisplayProps {
  originalImages: string[];
  stagedImages: string[];
  stagedImageHistory?: string[][];
  onEdit?: (initialInstructions?: string) => void;
  isEditMode?: boolean;
  onReset: () => void;
}
export default function ResultsDisplay({
  originalImages,
  stagedImages,
  stagedImageHistory = [],
  onEdit,
  isEditMode,
  onReset,
}: ResultsDisplayProps) {
  const [index, setIndex] = useState(0);
  const [version, setVersion] = useState<number | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const images =
    version === null
      ? stagedImages
      : stagedImageHistory[version] || stagedImages;
  const currentIndex = Math.min(index, images.length - 1);
  const image = images[currentIndex];
  const original = originalImages[currentIndex] || originalImages[0];
  if (!image) return null;
  const download = async () => {
    setDownloading(true);
    await downloadImage(image, `roomscape-design-${currentIndex + 1}.jpg`);
    setDownloading(false);
  };
  return (
    <div className="space-y-5">
      <RoomComparison
        original={original}
        staged={image}
        label={
          version === null ? "Your latest design" : `Version ${version + 1}`
        }
      />
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setIndex(i)}
              aria-label={`View design ${i + 1}`}
              aria-pressed={i === currentIndex}
              className={`shrink-0 overflow-hidden rounded-lg border-2 ${i === currentIndex ? "border-primary" : "border-transparent"}`}
            >
              <img src={src} alt="" className="h-14 w-20 object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setZoom(1);
              setFullscreen(true);
            }}
          >
            <Expand />
            Expand
          </Button>
          {onEdit && !isEditMode && (
            <Button variant="outline" size="sm" onClick={() => onEdit()}>
              <Pencil />
              Refine
            </Button>
          )}
        </div>
        <Button size="sm" onClick={download} disabled={downloading}>
          {downloading ? <Loader2 className="animate-spin" /> : <Download />}
          Download design
        </Button>
      </div>
      {stagedImageHistory.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 border-t pt-4 text-xs">
          <History size={14} />
          <span className="text-muted-foreground">This session</span>
          {stagedImageHistory.map((_, i) => (
            <Button
              key={i}
              size="sm"
              variant={
                version === i ||
                (version === null && i === stagedImageHistory.length - 1)
                  ? "secondary"
                  : "ghost"
              }
              className="h-7 text-xs"
              onClick={() => {
                setVersion(i === stagedImageHistory.length - 1 ? null : i);
                setIndex(0);
              }}
            >
              Version {i + 1}
            </Button>
          ))}
        </div>
      )}
      <Button
        variant="link"
        size="sm"
        className="px-0 text-xs text-muted-foreground"
        onClick={onReset}
      >
        <Plus />
        Design another room
      </Button>
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-h-[95dvh] max-w-[1200px] overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogTitle className="pr-8">Your room, in detail</DialogTitle>
          <DialogDescription>
            Compare the original and design, or zoom in to explore the details.
          </DialogDescription>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Zoom out"
              disabled={zoom <= 1}
              onClick={() => setZoom((value) => Math.max(1, value - 0.25))}
            >
              <ZoomOut />
            </Button>
            <span className="w-14 text-center text-xs">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Zoom in"
              disabled={zoom >= 2}
              onClick={() => setZoom((value) => Math.min(2, value + 0.25))}
            >
              <ZoomIn />
            </Button>
          </div>
          <div className="max-h-[65dvh] overflow-auto rounded-xl">
            <div style={{ width: `${zoom * 100}%` }}>
              <RoomComparison original={original} staged={image} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
