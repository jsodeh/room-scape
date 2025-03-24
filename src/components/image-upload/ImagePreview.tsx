
import { X, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImagePreviewProps {
  previews: string[];
  files?: File[]; // Added to determine file types
  onRemove: (index: number) => void;
  onAddMore: () => void;
}

const ImagePreview = ({ previews, files = [], onRemove, onAddMore }: ImagePreviewProps) => {
  // Function to determine if a file is a PDF
  const isPdf = (index: number) => {
    return files[index]?.type === 'application/pdf';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Selected Files</h3>
        <div className="flex items-center text-sm text-gray-500 gap-1">
          <span>{previews.length} file{previews.length === 1 ? '' : 's'}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {previews.map((preview, index) => (
          <div 
            key={preview} 
            className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
          >
            {isPdf(index) ? (
              <div className="w-full h-full flex items-center justify-center bg-blue-50">
                <FileText className="h-12 w-12 text-blue-500" />
              </div>
            ) : (
              <img
                src={preview}
                alt={`Preview ${index}`}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <Button
                variant="destructive"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
        <div
          className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onAddMore();
          }}
        >
          <div className="flex flex-col items-center justify-center p-4">
            <Image className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Add more</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
