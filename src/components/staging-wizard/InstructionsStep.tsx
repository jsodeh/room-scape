
import { Button } from '@/components/ui/button';
import { ImageIcon, Loader2 } from 'lucide-react';
import StageInstructions from '@/components/StageInstructions';
import { useStagingContext } from '@/context/StagingContext';

interface InstructionsStepProps {
  onSubmit: () => void;
  isProcessing: boolean;
}

const InstructionsStep = ({ onSubmit, isProcessing }: InstructionsStepProps) => {
  const { 
    handleInstructionsChange, 
    handleReferenceImageChange,
    stagingInstructions
  } = useStagingContext();

  const isStepComplete = stagingInstructions.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-medium">Staging Instructions</h2>
        <p className="text-sm text-muted-foreground">
          Provide specific instructions on how you'd like the room to be staged and optionally upload a reference image.
        </p>
      </div>
      
      <StageInstructions 
        onInstructionsChange={handleInstructionsChange}
        onReferenceImageChange={handleReferenceImageChange}
      />
      
      <div className="flex justify-end">
        <Button 
          onClick={onSubmit} 
          disabled={isProcessing || !isStepComplete}
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
