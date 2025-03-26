
import { Button } from '@/components/ui/button';
import { ArrowRight, SkipForward } from 'lucide-react';
import FurnitureSelector from '@/components/furniture/FurnitureSelector';
import { useStagingContext } from '@/context/StagingContext';

interface FurnitureStepProps {
  goToNextStep: () => void;
  skipToInstructions: () => void;
}

const FurnitureStep = ({ goToNextStep, skipToInstructions }: FurnitureStepProps) => {
  const { handleFurnitureSelected, selectedFurniture } = useStagingContext();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-medium">Select Furniture</h2>
        <p className="text-sm text-muted-foreground">
          Choose furniture items to include in your virtual staging, or skip this step to let our AI select appropriate furniture based on your instructions.
        </p>
      </div>
      
      <FurnitureSelector onFurnitureSelected={handleFurnitureSelected} />
      
      <div className="flex justify-between">
        <Button 
          onClick={skipToInstructions} 
          variant="outline"
          className="gap-2"
        >
          Skip <SkipForward className="h-4 w-4" />
        </Button>
        
        <Button 
          onClick={goToNextStep} 
          className="gap-2"
        >
          Next Step <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default FurnitureStep;
