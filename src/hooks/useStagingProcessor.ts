
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  createStagingProject, 
  generateStagedImages, 
  getStagingProject
} from '@/services/stagingService';
import { FurnitureItem } from '@/types/database';

interface StagingProcessorProps {
  userId?: string;
  originalImageUrls: string[];
  selectedFurniture: FurnitureItem[];
  stagingInstructions: string;
  referenceImageUrl: string | null;
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  setStagedImageResults: (results: string[]) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setIsComplete: (isComplete: boolean) => void;
}

export function useStagingProcessor({
  userId,
  originalImageUrls,
  selectedFurniture,
  stagingInstructions,
  referenceImageUrl,
  currentProjectId,
  setCurrentProjectId,
  setStagedImageResults,
  setIsProcessing,
  setIsComplete
}: StagingProcessorProps) {
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Poll for project status updates
  useEffect(() => {
    if (currentProjectId && setIsProcessing) {
      const interval = window.setInterval(async () => {
        try {
          const project = await getStagingProject(currentProjectId);
          
          if (project) {
            if (project.status === 'completed') {
              setStagedImageResults(project.staged_images);
              setIsProcessing(false);
              setIsComplete(true);
              clearInterval(interval);
              toast.success('Staging complete! Check out your results.');
            } else if (project.status === 'failed') {
              setIsProcessing(false);
              clearInterval(interval);
              toast.error('Staging failed. Please try again.');
            }
          }
        } catch (error) {
          console.error('Error polling project status:', error);
        }
      }, 5000); // Poll every 5 seconds
      
      setPollingInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [currentProjectId, setIsProcessing, setStagedImageResults, setIsComplete]);

  const handleSubmit = async () => {
    if (!userId) {
      toast.error('You must be logged in to submit a staging request');
      return;
    }

    if (originalImageUrls.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    // Allow empty furniture selection but provide a warning
    if (selectedFurniture.length === 0) {
      toast.warning('No furniture selected. We will stage the room based on your instructions only.');
    }

    // If no instructions are provided, create a default prompt
    let finalInstructions = stagingInstructions.trim();
    if (finalInstructions.length === 0) {
      if (selectedFurniture.length > 0) {
        // Create instructions based on selected furniture
        const furnitureTypes = [...new Set(selectedFurniture.map(item => item.category || 'item'))];
        finalInstructions = `Stage this room with ${furnitureTypes.join(', ')}. Make it look stylish and photorealistic.`;
        toast.info('Using auto-generated instructions based on your furniture selection.');
      } else {
        // Default instructions if nothing is provided
        finalInstructions = 'Stage this room to look modern, stylish, and inviting with appropriate furniture.';
        toast.info('Using default staging instructions.');
      }
    }
    
    setIsProcessing(true);
    
    try {
      // Create a new staging project
      const furnitureIds = selectedFurniture.map(item => item.id);
      
      const project = await createStagingProject(
        userId,
        finalInstructions,
        furnitureIds,
        originalImageUrls,
        referenceImageUrl || undefined
      );
      
      if (!project) {
        throw new Error('Failed to create staging project');
      }
      
      setCurrentProjectId(project.id);
      
      // Start the image generation process
      const furnitureUrls = selectedFurniture.map(item => item.image_url);
      
      await generateStagedImages(
        project.id,
        originalImageUrls[0], // Use the first image as the main room image
        furnitureUrls,
        finalInstructions,
        referenceImageUrl || undefined
      );
      
      toast.info('Staging request submitted. This may take a few minutes.');
    } catch (error) {
      console.error('Error processing staging request:', error);
      setIsProcessing(false);
      toast.error('An error occurred while processing your request. Please try again.');
    }
  };

  const handleRegenerate = async () => {
    if (!currentProjectId || !userId) {
      toast.error('Cannot regenerate without an active project');
      return;
    }
    
    setIsProcessing(true);
    setIsComplete(false);
    
    try {
      const furnitureUrls = selectedFurniture.map(item => item.image_url);
      
      // Use the same logic for empty instructions as in handleSubmit
      let finalInstructions = stagingInstructions.trim();
      if (finalInstructions.length === 0) {
        if (selectedFurniture.length > 0) {
          const furnitureTypes = [...new Set(selectedFurniture.map(item => item.category || 'item'))];
          finalInstructions = `Stage this room with ${furnitureTypes.join(', ')}. Make it look stylish and photorealistic.`;
        } else {
          finalInstructions = 'Stage this room to look modern, stylish, and inviting with appropriate furniture.';
        }
      }
      
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
    }
  };

  return {
    handleSubmit,
    handleRegenerate
  };
}
