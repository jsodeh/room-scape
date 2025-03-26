
import { toast } from 'sonner';
import { generateStagedImages } from '@/services/stagingService';
import { FurnitureItem } from '@/types/database';
import { useErrorReporting } from './useErrorReporting';

interface UseStagingRegenerationProps {
  userId?: string;
  currentProjectId: string | null;
  originalImageUrls: string[];
  selectedFurniture: FurnitureItem[];
  stagingInstructions: string;
  referenceImageUrl: string | null;
  setIsProcessing: (isProcessing: boolean) => void;
  setIsComplete: (isComplete: boolean) => void;
}

export function useStagingRegeneration({
  userId,
  currentProjectId,
  originalImageUrls,
  selectedFurniture,
  stagingInstructions,
  referenceImageUrl,
  setIsProcessing,
  setIsComplete
}: UseStagingRegenerationProps) {
  const { reportError, clearError } = useErrorReporting();

  const createFinalInstructions = () => {
    let finalInstructions = stagingInstructions.trim();
    if (finalInstructions.length === 0) {
      if (selectedFurniture.length > 0) {
        const furnitureTypes = [...new Set(selectedFurniture.map(item => item.category || 'item'))];
        finalInstructions = `Stage this room with ${furnitureTypes.join(', ')}. Make it look stylish and photorealistic.`;
      } else {
        finalInstructions = 'Stage this room to look modern, stylish, and inviting with appropriate furniture.';
      }
    }
    return finalInstructions;
  };

  const handleRegenerate = async () => {
    if (!currentProjectId || !userId) {
      return reportError('regeneration', 'Cannot regenerate without an active project');
    }
    
    // Clear any previous errors
    clearError();
    
    setIsProcessing(true);
    setIsComplete(false);
    
    try {
      const furnitureUrls = selectedFurniture.map(item => item.image_url);
      const finalInstructions = createFinalInstructions();
      
      console.log('Regenerating staged images for project:', currentProjectId);
      await generateStagedImages(
        currentProjectId,
        originalImageUrls[0],
        furnitureUrls,
        finalInstructions,
        referenceImageUrl || undefined
      );
      
      toast.info('Regenerating staged room. This may take a few minutes.');
    } catch (error) {
      console.error('Error regenerating staged room:', error);
      setIsProcessing(false);
      return reportError('regeneration', 'An error occurred while regenerating. Please try again.', error);
    }
  };

  return { handleRegenerate };
}
