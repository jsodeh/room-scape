
import { useResultsDisplay } from './results-display/hooks/useResultsDisplay';
import ImageViewer from './results-display/ImageViewer';
import ActionButtons from './results-display/ActionButtons';
import HistorySelector from './results-display/HistorySelector';
import ThumbnailGallery from './results-display/ThumbnailGallery';

interface ResultsDisplayProps {
  originalImages: string[];
  stagedImages: string[];
  stagedImageHistory?: string[][];
  onEdit?: (initialInstructions?: string) => void;
  isEditMode?: boolean;
  onReset: () => void;
}

const ResultsDisplay = ({ originalImages, stagedImages, stagedImageHistory = [], onEdit, isEditMode, onReset }: ResultsDisplayProps) => {
  const {
    state,
    hasHistory,
    allHistory,
    navigateToNext,
    navigateToPrevious,
    handleDownload,
    openFullscreen,
    toggleHistoryView,
    setHistoryIndex,
    toggleShowOriginal,
    setCurrentIndex,
    getCurrentImage,
    getViewLabel,
    getImageForThumbnail
  } = useResultsDisplay(originalImages, stagedImages, stagedImageHistory);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-3xl">
          <ImageViewer
            currentImage={getCurrentImage()}
            viewLabel={getViewLabel()}
            totalImages={stagedImages.length}
            currentIndex={state.currentIndex}
            showOriginal={state.showOriginal}
            onToggleOriginal={toggleShowOriginal}
            onNavigatePrevious={navigateToPrevious}
            onNavigateNext={navigateToNext}
          />
          
          <ActionButtons
            onReset={onReset}
            onEdit={onEdit}
            isEditMode={isEditMode}
            onOpenFullscreen={openFullscreen}
            onDownload={handleDownload}
            hasHistory={hasHistory}
            historyViewMode={state.historyViewMode}
            onToggleHistoryView={toggleHistoryView}
          />
          
          <HistorySelector
            historyViewMode={state.historyViewMode}
            historyLength={allHistory.length}
            currentHistoryIndex={state.historyIndex}
            onSelectHistoryIndex={setHistoryIndex}
          />
          
          <ThumbnailGallery
            totalImages={originalImages.length}
            currentIndex={state.currentIndex}
            onSelectImage={setCurrentIndex}
            getImageForIndex={getImageForThumbnail}
          />
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
