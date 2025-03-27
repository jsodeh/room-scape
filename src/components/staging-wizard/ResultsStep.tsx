
import { useStagingContext } from '@/context/StagingContext';
import ResultsDisplay from '@/components/ResultsDisplay';
import EditInstructionsInput from '@/components/EditInstructionsInput';
import { Loader2 } from 'lucide-react';

const ResultsStep = () => {
  const { 
    originalImageUrls, 
    stagedImageResults,
    stagedImageHistory,
    isProcessing, 
    isComplete,
    isEditMode,
    editInstructions,
    handleEdit,
    handleEditInstructionsChange,
    handleEditSubmit,
    resetState
  } = useStagingContext();

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-lg font-medium">
          {isEditMode ? 'Applying edits to your staged room...' : 'Generating your staged room...'}
        </p>
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
    <div className="animate-fade-in space-y-4">
      <ResultsDisplay 
        originalImages={originalImageUrls}
        stagedImages={stagedImageResults}
        stagedImageHistory={stagedImageHistory}
        onEdit={handleEdit}
        isEditMode={isEditMode}
        onReset={resetState}
      />

      {isEditMode && (
        <EditInstructionsInput 
          value={editInstructions}
          onChange={handleEditInstructionsChange}
          onSubmit={handleEditSubmit}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};

export default ResultsStep;
