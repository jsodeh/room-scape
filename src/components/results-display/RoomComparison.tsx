import { useState } from "react";
import { Columns2, Image as ImageIcon, MoveHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type View = "design" | "compare" | "original";
interface RoomComparisonProps {
  original?: string;
  staged: string;
  className?: string;
  label?: string;
}
export default function RoomComparison({
  original,
  staged,
  className,
  label = "Your design",
}: RoomComparisonProps) {
  const [view, setView] = useState<View>("design");
  const [split, setSplit] = useState(50);
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        {original && (
          <div
            className="inline-flex rounded-lg border bg-card p-1"
            aria-label="Image view"
          >
            {(["design", "compare", "original"] as const).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={view === value ? "secondary" : "ghost"}
                className="h-7 px-2.5 text-[11px]"
                aria-pressed={view === value}
                onClick={() => setView(value)}
              >
                {value === "compare" ? (
                  <Columns2 className="!h-3.5 !w-3.5" />
                ) : (
                  <ImageIcon className="!h-3.5 !w-3.5" />
                )}
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </Button>
            ))}
          </div>
        )}
      </div>
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-secondary"
        data-testid="room-comparison"
      >
        <img
          src={view === "original" && original ? original : staged}
          alt={view === "original" ? "Original room" : label}
          className="absolute inset-0 h-full w-full object-contain"
        />
        {view === "compare" && original && (
          <>
            <img
              src={original}
              alt="Original room for comparison"
              className="absolute inset-0 h-full w-full object-contain"
              style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
            />
            <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2.5 py-1 text-[10px] text-white">
              ORIGINAL
            </span>
            <span className="absolute right-3 top-3 rounded-md bg-black/60 px-2.5 py-1 text-[10px] text-white">
              DESIGN
            </span>
            <div
              className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow"
              style={{ left: `${split}%` }}
            >
              <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-stone-700 shadow-lg">
                <MoveHorizontal size={18} />
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={split}
              onChange={(event) => setSplit(Number(event.target.value))}
              aria-label="Before and after comparison"
              aria-valuetext={`${split}% original room`}
              className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0 focus-visible:opacity-100 focus-visible:h-8 focus-visible:top-auto focus-visible:bottom-0"
            />
          </>
        )}
      </div>
      {view === "compare" && (
        <p className="text-center text-[11px] text-muted-foreground">
          Drag to compare. You can also use the arrow keys.
        </p>
      )}
    </div>
  );
}
