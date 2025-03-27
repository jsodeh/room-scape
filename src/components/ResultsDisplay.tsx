
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ChevronLeft, ChevronRight, Maximize2, PencilIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

interface ResultsDisplayProps {
  originalImages: string[];
  stagedImages: string[];
  onEdit?: (instructions: string) => void;
  onReset: () => void;
}

const ResultsDisplay = ({ originalImages, stagedImages, onEdit, onReset }: ResultsDisplayProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editInstructions, setEditInstructions] = useState('');

  const navigateToNext = () => {
    if (currentIndex < stagedImages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const navigateToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = stagedImages[currentIndex];
    link.download = `staged-room-${currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image downloaded successfully');
  };

  const openFullscreen = () => {
    window.open(stagedImages[currentIndex], '_blank');
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSubmitEdit = () => {
    if (!editInstructions.trim()) {
      toast.error('Please provide editing instructions');
      return;
    }
    
    if (onEdit) {
      onEdit(editInstructions);
      setIsEditing(false);
      setEditInstructions('');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditInstructions('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-3xl">
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 shadow-md mb-4">
            <img
              src={showOriginal ? originalImages[currentIndex] : stagedImages[currentIndex]}
              alt={showOriginal ? "Original Room" : "Staged Room"}
              className="w-full h-full object-cover transition-all duration-500 ease-in-out"
            />
            
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-1.5 text-white text-sm font-medium">
              {showOriginal ? "Original" : "Staged"} Room {currentIndex + 1} of {stagedImages.length}
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <Button 
                variant="secondary" 
                className="bg-black/70 backdrop-blur-sm text-white border-0 hover:bg-black/80"
                onClick={() => setShowOriginal(!showOriginal)}
              >
                {showOriginal ? "View Staged" : "View Original"}
              </Button>
            </div>
            
            {originalImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10"
                  onClick={navigateToPrevious}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10"
                  onClick={navigateToNext}
                  disabled={currentIndex === stagedImages.length - 1}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
          
          {isEditing ? (
            <div className="mb-4 space-y-4 animate-fade-in border p-4 rounded-lg bg-gray-50">
              <h3 className="font-medium">Edit Staging Instructions</h3>
              <Textarea 
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
                placeholder="Provide additional instructions for how this room should be re-staged..."
                className="min-h-[120px]"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitEdit}>
                  Submit Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center mb-4">
              <Button variant="outline" onClick={onReset}>
                Start Over
              </Button>
              <div className="flex gap-2">
                {onEdit && (
                  <Button variant="outline" className="gap-2" onClick={handleEditClick}>
                    <PencilIcon className="h-4 w-4" />
                    Edit
                  </Button>
                )}
                <Button variant="outline" className="gap-2" onClick={openFullscreen}>
                  <Maximize2 className="h-4 w-4" />
                  Fullscreen
                </Button>
                <Button className="gap-2" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          )}
          
          {originalImages.length > 1 && (
            <ScrollArea className="w-full pb-4">
              <div className="flex gap-2 pb-4 px-1">
                {originalImages.map((image, index) => (
                  <div
                    key={index}
                    className={`relative rounded-md overflow-hidden cursor-pointer border-2 transition-all
                      ${currentIndex === index ? 'border-primary' : 'border-transparent'}`}
                    onClick={() => setCurrentIndex(index)}
                  >
                    <img
                      src={stagedImages[index]}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
