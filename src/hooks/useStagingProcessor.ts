
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
  const [pollingCount, setPollingCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

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
      const MAX_POLLING_COUNT = 60; // 5 minutes max (5000ms * 60)
      
      const interval = window.setInterval(async () => {
        try {
          setPollingCount(prev => prev + 1);
          
          // If we've been polling for too long, assume something went wrong
          if (pollingCount > MAX_POLLING_COUNT) {
            setIsProcessing(false);
            clearInterval(interval);
            toast.error('Staging timed out. Please try again with a smaller image or different instructions.');
            console.error('Staging timed out after maximum polling attempts');
            return;
          }
          
          console.log(`Polling project status (attempt ${pollingCount})...`);
          const project = await getStagingProject(currentProjectId);
          
          if (project) {
            console.log(`Project status: ${project.status}`, project);
            
            if (project.status === 'completed') {
              if (project.staged_images && project.staged_images.length > 0) {
                setStagedImageResults(project.staged_images);
                setIsProcessing(false);
                setIsComplete(true);
                clearInterval(interval);
                toast.success('Staging complete! Check out your results.');
                console.log('Staging completed successfully');
              } else {
                setIsProcessing(false);
                clearInterval(interval);
                toast.error('No images were generated. Please try again with different settings.');
                console.error('Project marked as completed but no images were returned');
              }
            } else if (project.status === 'failed') {
              setIsProcessing(false);
              clearInterval(interval);
              const errorMessage = project.error_message || 'Staging failed. Please try again.';
              toast.error(errorMessage);
              console.error('Project failed with message:', errorMessage);
              setLastError(errorMessage);
            } else {
              // Still processing, keep polling
              console.log(`Project status: ${project.status}`);
            }
          } else {
            console.error('Could not retrieve project data during polling');
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
  }, [currentProjectId, setIsProcessing, setStagedImageResults, setIsComplete, pollingCount]);

  const handleSubmit = async () => {
    if (!userId) {
      toast.error('You must be logged in to submit a staging request');
      return;
    }

    if (originalImageUrls.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    // Reset any previous errors
    setLastError(null);
    setPollingCount(0);
    
    // If no furniture is selected, just inform the user that AI will choose appropriate furniture
    if (selectedFurniture.length === 0) {
      toast.info('No furniture selected. Our AI will choose appropriate furniture for your room.');
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
      toast.error('An error occurred while processing your request. Please try again.');
    }
  };

  const handleRegenerate = async () => {
    if (!currentProjectId || !userId) {
      toast.error('Cannot regenerate without an active project');
      return;
    }
    
    // Reset error state and polling count
    setLastError(null);
    setPollingCount(0);
    
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
    }
  };

  return {
    handleSubmit,
    handleRegenerate,
    lastError
  };
}
