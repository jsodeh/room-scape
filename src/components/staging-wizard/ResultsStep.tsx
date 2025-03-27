
import { useStagingContext } from '@/context/StagingContext';
import ResultsDisplay from '@/components/ResultsDisplay';
import { Loader2 } from 'lucide-react';

const ResultsStep = () => {
  const { 
    originalImageUrls, 
    stagedImageResults, 
    isProcessing, 
    isComplete,
    setIsEditing,
    resetState
  } = useStagingContext();

  const handleEdit = (instructions: string) => {
    setIsEditing(true);
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-lg font-medium">Generating your staged room...</p>
        <p className="text-sm text-muted-foreground">This may take a few minutes.</p>
      </div>
    );
  }

  if (!isComplete || stagedImageResults.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          Your staged room images will appear here once generated.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <ResultsDisplay 
        originalImages={originalImageUrls}
        stagedImages={stagedImageResults}
        onEdit={handleEdit}
        onReset={resetState}
      />
    </div>
  );
};

export default ResultsStep;
