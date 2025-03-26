
import { useState } from 'react';
import { toast } from 'sonner';
import { 
  createStagingProject, 
  generateStagedImages 
} from '@/services/stagingService';
import { FurnitureItem } from '@/types/database';
import { useErrorReporting } from './useErrorReporting';

interface UseStagingSubmissionProps {
  userId?: string;
  originalImageUrls: string[];
  selectedFurniture: FurnitureItem[];
  stagingInstructions: string;
  referenceImageUrl: string | null;
  setCurrentProjectId: (id: string | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
}

export function useStagingSubmission({
  userId,
  originalImageUrls,
  selectedFurniture,
  stagingInstructions,
  referenceImageUrl,
  setCurrentProjectId,
  setIsProcessing
}: UseStagingSubmissionProps) {
  const { reportError, clearError } = useErrorReporting();

  const createFinalInstructions = () => {
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
    return finalInstructions;
  };
  
  const handleSubmit = async () => {
    if (!userId) {
      return reportError('submission', 'You must be logged in to submit a staging request');
    }

    if (originalImageUrls.length === 0) {
      return reportError('submission', 'Please upload at least one image');
    }

    // Clear any previous errors
    clearError();
    
    // If no furniture is selected, just inform the user that AI will choose appropriate furniture
    if (selectedFurniture.length === 0) {
      toast.info('No furniture selected. Our AI will choose appropriate furniture for your room.');
    }

    const finalInstructions = createFinalInstructions();
    
    setIsProcessing(true);
    toast.info('Starting the staging process. This may take a few minutes...');
    
    try {
      console.log('Starting staging process...');
      console.log('User ID:', userId);
      console.log('Original image URLs:', originalImageUrls);
      console.log('Selected furniture count:', selectedFurniture.length);
      console.log('Staging instructions:', finalInstructions);
      console.log('Reference image URL:', referenceImageUrl);
      
      // Create a new staging project
      const furnitureIds = selectedFurniture.map(item => item.id);
      
      console.log('Creating staging project...');
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
      
      console.log('Project created with ID:', project.id);
      setCurrentProjectId(project.id);
      
      // Start the image generation process
      const furnitureUrls = selectedFurniture.map(item => item.image_url);
      
      console.log('Generating staged images...');
      await generateStagedImages(
        project.id,
        originalImageUrls[0], // Use the first image as the main room image
        furnitureUrls,
        finalInstructions,
        referenceImageUrl || undefined
      );
      
      toast.info('Staging request submitted. This may take a few minutes.');
      console.log('Staging request submitted successfully');
    } catch (error) {
      console.error('Error processing staging request:', error);
      setIsProcessing(false);
      return reportError('submission', 'An error occurred while processing your request. Please try again.', error);
    }
  };

  return { handleSubmit };
}
