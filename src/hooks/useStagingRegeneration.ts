
import { useState } from 'react';
import { toast } from 'sonner';
import { generateStagedImages } from '@/services/stagingService';
import { FurnitureItem } from '@/types/database';

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
  const [lastError, setLastError] = useState<string | null>(null);

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
      toast.error('Cannot regenerate without an active project');
      return;
    }
    
    // Reset error state
    setLastError(null);
    
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
      toast.error('An error occurred while regenerating. Please try again.');
      setLastError(error.message);
    }
  };

  return { handleRegenerate, lastError };
}
