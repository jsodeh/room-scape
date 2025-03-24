
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import FurnitureSelector from '@/components/furniture/FurnitureSelector';
import { useStagingContext } from '@/context/StagingContext';

interface FurnitureStepProps {
  goToNextStep: () => void;
}

const FurnitureStep = ({ goToNextStep }: FurnitureStepProps) => {
  const { handleFurnitureSelected, selectedFurniture } = useStagingContext();

  const isStepComplete = selectedFurniture.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-medium">Select Furniture</h2>
        <p className="text-sm text-muted-foreground">
          Choose furniture items to include in your virtual staging. Select multiple items from different categories or upload your own custom furniture.
        </p>
      </div>
      
      <FurnitureSelector onFurnitureSelected={handleFurnitureSelected} />
      
      <div className="flex justify-end">
        <Button 
          onClick={goToNextStep} 
          disabled={!isStepComplete}
          className="gap-2"
        >
          Next Step <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default FurnitureStep;
