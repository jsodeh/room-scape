
import { Button } from '@/components/ui/button';
import { ImageIcon, Loader2, LightbulbIcon } from 'lucide-react';
import StageInstructions from '@/components/StageInstructions';
import { useStagingContext } from '@/context/StagingContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InstructionsStepProps {
  onSubmit: () => void;
  isProcessing: boolean;
}

const InstructionsStep = ({ onSubmit, isProcessing }: InstructionsStepProps) => {
  const { 
    handleInstructionsChange, 
    handleReferenceImageChange,
    handleReferenceImageUpload,
    stagingInstructions,
    uploadedImages,
    selectedFurniture
  } = useStagingContext();

  // We're removing the mandatory check for instructions
  // since we now handle empty instructions in the processor
  const hasImages = uploadedImages.length > 0;
  const canSubmit = hasImages && !isProcessing;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-medium">Staging Instructions</h2>
        <p className="text-sm text-muted-foreground">
          Provide specific instructions on how you'd like the room to be staged or select a template. You can also upload a reference image.
        </p>
      </div>
      
      {selectedFurniture.length === 0 && (
        <Alert className="bg-amber-50 border-amber-200">
          <LightbulbIcon className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-800">
            No furniture selected. You can still continue, but providing detailed instructions will help us stage your room better.
          </AlertDescription>
        </Alert>
      )}
      
      <StageInstructions 
        onInstructionsChange={handleInstructionsChange}
        onReferenceImageChange={handleReferenceImageChange}
        onReferenceImageUpload={handleReferenceImageUpload}
      />
      
      <div className="flex justify-end">
        <Button 
          onClick={onSubmit} 
          disabled={!canSubmit}
          className="gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4" />
              Generate Staged Room
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default InstructionsStep;
