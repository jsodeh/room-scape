
import { ScrollArea } from '@/components/ui/scroll-area';

interface ThumbnailGalleryProps {
  totalImages: number;
  currentIndex: number;
  onSelectImage: (index: number) => void;
  getImageForIndex: (index: number) => string;
}

const ThumbnailGallery = ({
  totalImages,
  currentIndex,
  onSelectImage,
  getImageForIndex
}: ThumbnailGalleryProps) => {
  if (totalImages <= 1) {
    return null;
  }

  return (
    <ScrollArea className="w-full pb-4">
      <div className="flex gap-2 pb-4 px-1">
        {Array.from({ length: totalImages }).map((_, index) => (
          <div
            key={index}
            className={`relative rounded-md overflow-hidden cursor-pointer border-2 transition-all
              ${currentIndex === index ? 'border-primary' : 'border-transparent'}`}
            onClick={() => onSelectImage(index)}
          >
            <img
              src={getImageForIndex(index)}
              alt={`Thumbnail ${index + 1}`}
              className="h-20 w-24 object-cover"
            />
            <div className={`absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors
              ${currentIndex === index ? 'bg-black/10' : ''}`}
            />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ThumbnailGallery;
