
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ChevronLeft, ChevronRight, Maximize2, Pencil, History } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ResultsDisplayProps {
  originalImages: string[];
  stagedImages: string[];
  stagedImageHistory?: string[][];
  onEdit?: (initialInstructions?: string) => void;
  isEditMode?: boolean;
  onReset: () => void;
}

const ResultsDisplay = ({ originalImages, stagedImages, stagedImageHistory = [], onEdit, isEditMode, onReset }: ResultsDisplayProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);
  const [historyViewMode, setHistoryViewMode] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1); // -1 means current result

  // Calculate the total history
  const hasHistory = stagedImageHistory.length > 1;
  const allHistory = [...stagedImageHistory.slice(0, -1), stagedImages]; // Add current images as last entry

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
    // Download current view (either from history or current result)
    const imageToDownload = historyViewMode && historyIndex >= 0
      ? allHistory[historyIndex][currentIndex] 
      : stagedImages[currentIndex];
      
    const link = document.createElement('a');
    link.href = imageToDownload;
    link.download = `staged-room-${historyViewMode ? `v${historyIndex+1}-` : ''}${currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image downloaded successfully');
  };

  const openFullscreen = () => {
    const imageToView = historyViewMode && historyIndex >= 0
      ? allHistory[historyIndex][currentIndex]
      : stagedImages[currentIndex];
    window.open(imageToView, '_blank');
  };

  const toggleHistoryView = () => {
    setHistoryViewMode(!historyViewMode);
    setHistoryIndex(-1); // Reset to current result
  };

  // Get the current image to display (from history or current results)
  const getCurrentImage = () => {
    if (historyViewMode && historyIndex >= 0 && historyIndex < allHistory.length) {
      return showOriginal ? originalImages[currentIndex] : allHistory[historyIndex][currentIndex];
    }
    return showOriginal ? originalImages[currentIndex] : stagedImages[currentIndex];
  };

  // Get the display label for the current view
  const getViewLabel = () => {
    if (showOriginal) return "Original";
    
    if (historyViewMode && historyIndex >= 0) {
      return `Version ${historyIndex + 1}`;
    }
    
    return "Staged";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-3xl">
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 shadow-md mb-4">
            <img
              src={getCurrentImage()}
              alt={`${getViewLabel()} Room`}
              className="w-full h-full object-cover transition-all duration-500 ease-in-out"
            />
            
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-1.5 text-white text-sm font-medium">
              {getViewLabel()} Room {currentIndex + 1} of {stagedImages.length}
              {historyViewMode && historyIndex >= 0 && " (Historical View)"}
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <Button 
                variant="secondary" 
                className="bg-black/70 backdrop-blur-sm text-white border-0 hover:bg-black/80"
                onClick={() => setShowOriginal(!showOriginal)}
              >
                {showOriginal ? "View Result" : "View Original"}
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
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onReset}>
                Start Over
              </Button>
              
              {hasHistory && (
                <Button 
                  variant={historyViewMode ? "default" : "outline"} 
                  className="gap-2" 
                  onClick={toggleHistoryView}
                >
                  <History className="h-4 w-4" />
                  {historyViewMode ? "Current Result" : "View History"}
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {onEdit && !isEditMode && (
                <Button variant="outline" className="gap-2" onClick={() => onEdit()}>
                  <Pencil className="h-4 w-4" />
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
          
          {/* History view controls */}
          {historyViewMode && allHistory.length > 0 && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <h3 className="text-sm font-medium mb-2">Editing History</h3>
              <div className="flex flex-wrap gap-2">
                {allHistory.map((_, idx) => (
                  <Button
                    key={idx}
                    variant={historyIndex === idx ? "default" : "outline"}
                    size="sm"
                    onClick={() => setHistoryIndex(idx)}
                  >
                    Version {idx + 1}
                  </Button>
                ))}
                <Button
                  variant={historyIndex === -1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHistoryIndex(-1)}
                >
                  Current
                </Button>
              </div>
            </div>
          )}
          
          {originalImages.length > 1 && (
            <ScrollArea className="w-full pb-4">
              <div className="flex gap-2 pb-4 px-1">
                {originalImages.map((_, index) => (
                  <div
                    key={index}
                    className={`relative rounded-md overflow-hidden cursor-pointer border-2 transition-all
                      ${currentIndex === index ? 'border-primary' : 'border-transparent'}`}
                    onClick={() => setCurrentIndex(index)}
                  >
                    <img
                      src={historyViewMode && historyIndex >= 0 
                        ? allHistory[historyIndex][index] 
                        : stagedImages[index]}
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
