
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageViewerProps {
  currentImage: string;
  viewLabel: string;
  totalImages: number;
  currentIndex: number;
  showOriginal: boolean;
  onToggleOriginal: () => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
}

const ImageViewer = ({
  currentImage,
  viewLabel,
  totalImages,
  currentIndex,
  showOriginal,
  onToggleOriginal,
  onNavigatePrevious,
  onNavigateNext
}: ImageViewerProps) => {
  return (
    <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 shadow-md mb-4">
      <img
        src={currentImage}
        alt={`${viewLabel} Room`}
        className="w-full h-full object-cover transition-all duration-500 ease-in-out"
      />
      
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-1.5 text-white text-sm font-medium">
        {viewLabel} Room {currentIndex + 1} of {totalImages}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        <Button 
          variant="secondary" 
          className="bg-black/70 backdrop-blur-sm text-white border-0 hover:bg-black/80"
          onClick={onToggleOriginal}
        >
          {showOriginal ? "View Result" : "View Original"}
        </Button>
      </div>
      
      {totalImages > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10"
            onClick={onNavigatePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10"
            onClick={onNavigateNext}
            disabled={currentIndex === totalImages - 1}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}
    </div>
  );
};

export default ImageViewer;
